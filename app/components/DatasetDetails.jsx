import React, { Component, PropTypes } from 'react'
import {Row, Col, Panel, Label} from 'react-bootstrap'

var labelStyle = {
  marginRight: '5px'
}

var defStyle = {
  minHeight: '200px'
}

var humanType = {
  'text': 'Text',
  'category': 'Category',
  'checkbox': 'True/False',
  'calendar_date': 'Date/Time',
  'location': 'Latitude and Longitude',
  'number': 'Number'
}

class DatasetDetails extends Component {

  renderColumnCard (key, idx, columns) {
    let column = columns[key]
    let title = <h2>{column.name}</h2>
    return (
      <Col md={4} key={idx}>
        <Panel header={title} style={defStyle}>
          <p>{column.description}</p>
          <Label bsStyle='info' style={labelStyle}>Field type: {humanType[column.type]}</Label>
          <Label bsStyle='info' style={labelStyle}>API name: {column.key}</Label>
        </Panel>
      </Col>
      )
  }

  render () {
    let { columns } = this.props.dataset
    let rows = []
    if (columns) {
      let keys = Object.keys(columns)
      let definitions = keys.map((key, idx) => {
        return this.renderColumnCard(key, idx, columns)
      })
      for (let i = 0; i < keys.length; i += 3) {
        rows.push(
          <Row key={i}>
            {definitions[i]}
            {definitions[i + 1]}
            {definitions[i + 2]}
          </Row>)
      }
    }

    return (
      <div>
        {rows}
      </div>
      )
  }
}

export default DatasetDetails
