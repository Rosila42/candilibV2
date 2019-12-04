import { SUBJECT_MAIL_VALIDATION } from '../business'
import getMailData from '../business/message-templates'
import {
  createDepartement,
  deleteDepartementById,
} from '../../models/departement/departement.queries'

const request = require('supertest')

const { connect, disconnect } = require('../../mongo-connection')
const {
  deleteCandidatByNomNeph,
  findCandidatByNomNeph,
  createCandidat,
} = require('../../models/candidat')
const {
  createWhitelisted,
  deleteWhitelistedByEmail,
} = require('../../models/whitelisted')
const { default: app, apiPrefix } = require('../../app')

const validEmail = 'candidat@example.com'
const invalidEmail = 'candidatexample.com'
const portable = '0612345678'
const adresse = '10 Rue Hoche 93420 Villepinte'
const nomNaissance = 'Dupont'
const codeNeph = '123456789012'
const prenom = ' test prenom '
const validEmail1 = 'candidat1@example.com'
const portable1 = '0612345679'
const adresse1 = '11 Rue Hoche 93420 Villepinte'
const nomNaissance1 = 'test'
const codeNeph1 = '123456789013'
const validEmail2 = 'candidat2@example.com'
const departementTest = '93'

const incompleteCandidat = {
  codeNeph,
}

const candidatWithInvalidEmail = {
  codeNeph,
  nomNaissance,
  prenom,
  portable,
  email: invalidEmail,
  adresse,
}

const validCandidat = {
  codeNeph,
  nomNaissance,
  prenom,
  portable,
  email: validEmail,
  adresse,
  departement: departementTest,
}

const validCandidat1 = {
  codeNeph: codeNeph1,
  nomNaissance: nomNaissance1,
  prenom,
  portable: portable1,
  email: validEmail1,
  adresse: adresse1,
}

const updateFailedCandidatWithEmailExist = {
  codeNeph,
  nomNaissance,
  prenom,
  portable,
  email: validEmail1,
  adresse,
}

const updateCandidat = {
  codeNeph,
  nomNaissance,
  prenom,
  portable: portable1,
  email: validEmail2,
  adresse: adresse1,
}

jest.mock('../business/send-mail')

jest.mock('../../util/logger')
require('../../util/logger').setWithConsole(false)

describe('Test the candidat signup', () => {
  const departementData = { _id: '93', email: 'email93@onepiece.com' }
  beforeAll(async () => {
    await connect()
    await createDepartement(departementData)
  })

  afterEach(async () => {
    try {
      await deleteCandidatByNomNeph(nomNaissance, codeNeph)
    } catch (error) {}
  })

  afterAll(async () => {
    await deleteDepartementById(departementData._id)
    await disconnect()
    await app.close()
  })

  it('Should response 400 and a list of fields for an incomplete form', async () => {
    const { body } = await request(app)
      .post(`${apiPrefix}/candidat/preinscription`)
      .send(incompleteCandidat)
      .set('Accept', 'application/json')
      .expect(400)

    expect(body).toHaveProperty('success', false)
    expect(body).toHaveProperty('fieldsWithErrors')
    expect(body.fieldsWithErrors).toContain('email')
    expect(body.fieldsWithErrors).toContain('nomNaissance')
    expect(body.fieldsWithErrors).toContain('adresse')
    expect(body.fieldsWithErrors).toContain('portable')
    expect(body.fieldsWithErrors).not.toContain('codeNeph')
  })

  it('Should response 400 and a list of 1 field for complete form with an invalid email', async () => {
    const { body } = await request(app)
      .post(`${apiPrefix}/candidat/preinscription`)
      .send(candidatWithInvalidEmail)
      .set('Accept', 'application/json')
      .expect(400)

    expect(body).toHaveProperty('success', false)
    expect(body).toHaveProperty('fieldsWithErrors')
    expect(body.fieldsWithErrors).toContain('email')
    expect(body.fieldsWithErrors).not.toContain('nomNaissance')
    expect(body.fieldsWithErrors).not.toContain('adresse')
    expect(body.fieldsWithErrors).not.toContain('portable')
    expect(body.fieldsWithErrors).not.toContain('codeNeph')
  })

  it('Should response 401 for a valid form but an unknown email', async () => {
    const { body } = await request(app)
      .post(`${apiPrefix}/candidat/preinscription`)
      .send(validCandidat)
      .set('Accept', 'application/json')
      .expect(401)

    expect(body).toHaveProperty('success', false)
    expect(body).not.toHaveProperty('candidat')
  })

  it('Should response 200 for a valid form', async () => {
    await createWhitelisted(validEmail, departementData._id)
    const { body } = await request(app)
      .post(`${apiPrefix}/candidat/preinscription`)
      .send(validCandidat)
      .set('Accept', 'application/json')
      .expect(200)

    expect(body).toHaveProperty('success')
    expect(body).not.toHaveProperty('fieldsWithErrors')
    expect(body).toHaveProperty('candidat')
    const { candidat } = body
    await expectMailValidationEmail(candidat)
    await deleteWhitelistedByEmail(validEmail)
  })

  describe('Test the update of candidat with signup', () => {
    beforeAll(async () => {
      await createWhitelisted(validEmail, departementData._id)
      await createWhitelisted(validEmail1, departementData._id)
      await createWhitelisted(validEmail2, departementData._id)
      await createCandidat(validCandidat1)
    })

    beforeEach(async () => {
      await createCandidat(validCandidat)
    })
    afterEach(async () => {
      await deleteCandidatByNomNeph(
        validCandidat.nomNaissance,
        validCandidat.codeNeph
      )
    })

    afterAll(async () => {
      try {
        await deleteWhitelistedByEmail(validEmail)
        await deleteWhitelistedByEmail(validEmail1)
        await deleteWhitelistedByEmail(validEmail2)
        await deleteCandidatByNomNeph(
          validCandidat1.nomNaissance,
          validCandidat1.codeNeph
        )
      } catch (error) {}
    })

    it('Should response 409 for an existing candidat', async () => {
      const { body } = await request(app)
        .post(`${apiPrefix}/candidat/preinscription`)
        .send(validCandidat)
        .set('Accept', 'application/json')
        .expect(409)

      expect(body).toHaveProperty('success', false)
      expect(body).toHaveProperty('message')

      const candidat = await findCandidatByNomNeph(
        validCandidat.nomNaissance,
        validCandidat.codeNeph
      )
      expect(candidat).toHaveProperty('email', validCandidat.email)
      expect(candidat).toHaveProperty('prenom', validCandidat.prenom.trim())
      expect(candidat).toHaveProperty('portable', validCandidat.portable)
      expect(candidat).toHaveProperty('adresse', validCandidat.adresse)
      expect(candidat).toHaveProperty('email', validCandidat.email)
    })

    it('Should response 409 with an existing email', async () => {
      const { body } = await request(app)
        .post(`${apiPrefix}/candidat/preinscription`)
        .send(updateFailedCandidatWithEmailExist)
        .set('Accept', 'application/json')
        .expect(409)

      expect(body).toHaveProperty('success', false)
      expect(body).toHaveProperty('message')

      const candidat = await findCandidatByNomNeph(
        validCandidat.nomNaissance,
        validCandidat.codeNeph
      )
      expect(candidat).not.toHaveProperty(
        'email',
        updateFailedCandidatWithEmailExist.email
      )
    })

    it('Should successfully update the candidat', async () => {
      const { body } = await request(app)
        .post(`${apiPrefix}/candidat/preinscription`)
        .send(updateCandidat)
        .set('Accept', 'application/json')
        .expect(200)

      expect(body).not.toHaveProperty('success', false)
      expect(body).toHaveProperty('message')

      const candidat = await findCandidatByNomNeph(
        updateCandidat.nomNaissance,
        updateCandidat.codeNeph
      )

      expect(candidat).toHaveProperty('prenom', updateCandidat.prenom.trim())
      expect(candidat).toHaveProperty(
        'portable',
        updateCandidat.portable.trim()
      )
      expect(candidat).toHaveProperty('adresse', updateCandidat.adresse.trim())
      expect(candidat).toHaveProperty('email', updateCandidat.email.trim())
    })
  })
})

const expectMailValidationEmail = async candidat => {
  const bodyMail = require('../business/send-mail').getMail()
  expect(bodyMail).toBeDefined()
  expect(bodyMail).toHaveProperty('to', candidat.email)
  expect(bodyMail).toHaveProperty('subject', SUBJECT_MAIL_VALIDATION)
  const mailData = await getMailData(candidat, 'VALIDATION_EMAIL')
  expect(bodyMail).toHaveProperty('html', mailData.content)
}
