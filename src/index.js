import './styles/bootstrap-explorer.css'
import React from 'react'
import { render } from 'react-dom'
import { hashHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import Root from './containers/Root'
import configureStore from './store/configureStore'

const initialState = {
  metadata: {
    query: {
      dateBy: 'year',
      rollupBy: 'other'
    },
    table: {
      tablePage: 0
    }
  },
  table: {
    tablePage: 0
  },
  query: {
    groupKeys: []
  }
}
const store = configureStore(initialState)
const history = syncHistoryWithStore(hashHistory, store)
render(
  <Root store={store} history={history} />,
  document.getElementById('root')
)
