import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'
import { Panel } from 'react-bootstrap'

class SumOptions extends Component {
  render () {
    let { columns, selected, onSumBy } = this.props
    return (
      columns.length !== 0
        ? <Panel collapsible defaultExpanded header='Sum by a numeric field' bsStyle={'primary'}>
          <Select
            name='sumby'
            placeholder='Select a field to sum by'
            options={columns}
            value={selected}
            onChange={onSumBy} />
        </Panel>
      : false
    )
  }
}

SumOptions.propTypes = {
  columns: PropTypes.array,
  selected: PropTypes.string,
  onSumBy: PropTypes.func
}

export default SumOptions
