import ArchivedCandidat from './archived-candidat.model'
import Place from '../place/place.model'
import moment from 'moment'

export const createArchivedCandidat = async ({
  codeNeph,
  nomNaissance,
  prenom,
  portable,
  email,
  emailValidationHash,
  adresse,
}) => {
  const candidat = await new ArchivedCandidat({
    codeNeph,
    nomNaissance,
    prenom,
    portable,
    email,
    emailValidationHash,
    adresse,
    presignedUpAt: new Date(),
  })
  await candidat.save()
  return candidat
}

export const countArchivedCandidats = async () => ArchivedCandidat.count()

export const findAllArchivedCandidatsLean = async () => {
  const candidats = await ArchivedCandidat.find({}).lean()
  return candidats
}

export const findArchivedCandidatByEmail = async email => {
  const candidat = await ArchivedCandidat.findOne({ email })
  return candidat
}

export const findArchivedCandidatById = async (id, options) => {
  const candidat = await ArchivedCandidat.findById(id, options)
  return candidat
}

export const findActiveArchivedCandidatByEmail = async email => {
  const candidat = await ArchivedCandidat.findOne({
    email,
    archived: undefined,
  })
  return candidat
}

export const findArchivedCandidatByNomNeph = async (nomNaissance, codeNeph) => {
  const candidat = await ArchivedCandidat.findOne({ nomNaissance, codeNeph })
  return candidat
}

export const findArchivedCandidatByNomNephFullText = async $search => {
  const candidat = await ArchivedCandidat.find(
    { $text: { $search } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } })
  return candidat
}

export const deleteArchivedCandidatByNomNeph = async (
  nomNaissance,
  codeNeph
) => {
  const candidat = await ArchivedCandidat.findOne({ nomNaissance, codeNeph })
  if (!candidat) {
    throw new Error('No candidat found')
  }
  await candidat.delete()
  return candidat
}

export const deleteArchivedCandidat = async candidat => {
  if (!candidat) {
    throw new Error('No candidat given')
  }
  await candidat.delete()
  return candidat
}

export const updateArchivedCandidatEmail = async (candidat, email) => {
  if (!candidat) {
    throw new Error('candidat is undefined')
  }
  await candidat.update({ email })
  const updatedArchivedCandidat = await ArchivedCandidat.findById(candidat._id)
  return updatedArchivedCandidat
}

export const findBookedArchivedCandidats = async (date, inspecteur, centre) => {
  let query = Place.where('bookedBy').exists(true)
  if (date && moment(date).isValid()) {
    const startDate = moment(date)
      .startOf('day')
      .toISOString()
    const endDate = moment(date)
      .endOf('day')
      .toISOString()
    query
      .where('date')
      .gte(startDate)
      .lt(endDate)
  }

  if (inspecteur && inspecteur.trim().length > 0) {
    query = query.where('inspecteur', inspecteur)
  }
  if (centre && centre.trim().length > 0) query = query.where('centre', centre)

  const places = await query.exec()
  if (places) {
    const candidats = await Promise.all(
      places.map(async place => {
        const { bookedBy: id } = place
        const candidat = await ArchivedCandidat.findById(id)
        if (!candidat) return {}
        candidat.place = place
        return candidat
      })
    )
    return candidats
  }
  return null
}

export const updateArchivedCandidatSignUp = async (candidat, data) => {
  const { prenom, email, portable, adresse } = data

  if (!candidat) {
    throw new Error('candidat is undefined')
  }
  await candidat.update({ prenom, email, portable, adresse })
  const updatedArchivedCandidat = await ArchivedCandidat.findById(candidat._id)
  return updatedArchivedCandidat
}

export const updateArchivedCandidatById = async (id, updatedData) => {
  const updateInfo = await ArchivedCandidat.findByIdAndUpdate(id, updatedData)
  return updateInfo
}
