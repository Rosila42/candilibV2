import Vuex from 'vuex'

import { shallowMount, mount } from '@vue/test-utils'
import Login from './Login.vue'

describe('Login.vue', () => {
  it('renders props.msg when passed', () => {
    const title = 'ADMINISTRATEUR'
    const subtitle = 'CANDILIB'
    const wrapper = shallowMount(Login, { stubs: ['bandeau-beta'] })

    expect(wrapper.text()).toContain(title)
    expect(wrapper.text()).toContain(subtitle)
    expect(wrapper.text()).toContain('Connexion')

    expect(wrapper.find('v-form')).toHaveProperty('selector', 'v-form')
    const componentTextFields = wrapper.findAllComponents({ name: 'v-text-field' })
    expect(componentTextFields).toHaveLength(2)
    componentTextFields.wrappers.forEach(w => {
      expect(['email', 'mot de passe'].includes(w.props('label'))).toBe(true)
    })

    const buttonConnexion = wrapper.find('button')
    expect(buttonConnexion.exists()).toBe(true)
    expect(buttonConnexion.text()).toBe('Connexion')

    const componentResetPassword = wrapper.find('email-password-reset-stub')
    expect(componentResetPassword.exists()).toBe(true)
    const componentBandeauBeta = wrapper.find('bandeau-beta-stub')
    expect(componentBandeauBeta.exists()).toBe(true)
  })

  it('connexion', async () => {
    const FETCH_TOKEN_REQUEST = jest.fn()

    const store = new Vuex.Store({
      state: {
        auth: {
          statusAdmin: 'SIGNED_IN_AS_ADMIN',
        },
      },
      actions: {
        FETCH_TOKEN_REQUEST,
        SHOW_SUCCESS ({ commit }, message) {
          expect(message).toBe('Vous êtes identifié')
        },
        SHOW_INFO ({ commit }, message) {
          expect(message).toBe('Vérification des identifiants en cours...')
        },
      },
    })

    const $router = {
      push: (path) => {
        expect(path).toBe('/admin')
      },
    }

    const $route = {
      query: {
        nextPath: undefined,
      },
    }
    const wrapper = mount(Login, {
      stubs: {
        'bandeau-beta': true,
        'email-password-reset': true,
      },
      store,
      mocks: {
        $router,
        $route,
      },
    })
    wrapper.setData({
      email: 'test@example.com',
      password: 'Exampl3!',
      valid: true,
    })

    const forms = wrapper.findAllComponents({ name: 'v-form' })
    expect(forms.length).toBe(1)
    const form = forms.wrappers[0]
    await form.trigger('submit')

    expect(FETCH_TOKEN_REQUEST).toHaveBeenCalled()
  })
})
