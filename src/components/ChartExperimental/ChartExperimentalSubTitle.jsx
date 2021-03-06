import React, { Component } from 'react'
import PropTypes from 'prop-types'
import isEmpty from 'lodash/isEmpty'
import titleize from 'titleize'
import moment from 'moment'

class ChartExperimentalSubTitle extends Component {
  constructor (props) {
    super(props)

    this.filterCategories = this.filterCategories.bind(this)
    this.filterDates = this.filterDates.bind(this)
    this.filterNumbers = this.filterNumbers.bind(this)
  }

  filterCategories (columnFilter, columnFilterName) {
    let subtitle = ''
    let fitlerCategory
    let { columns } = this.props

    if (typeof columnFilter.options['selected'] === 'string') {
      subtitle += titleize(columnFilter.options['selected'].toLowerCase())
    } else {
      subtitle = columnFilter.options['selected'].map(function (item) {
        return columnFilter.options.filterType === 'category' ? titleize(item) : titleize(columns[item].name)
      }).join(', ')
    }
    if (subtitle.length > 0) {
      fitlerCategory = 'Only Showing ' + subtitle
      subtitle = 'Filtering by ' + titleize(columnFilterName)
      subtitle = subtitle + ': ' + fitlerCategory
    }
    return <div key={columnFilterName}>{subtitle}</div>
  }

  filterDates (columnFilter, columnFilterName) {
    let subtitle = ''
    let fitlerCategory
    let minDt = moment(columnFilter.options.min).format('MM/DD/YYYY')
    let maxDt = moment(columnFilter.options.max).format('MM/DD/YYYY')
    subtitle = 'Filtering by ' + titleize(columnFilterName)
    fitlerCategory = 'Only Showing Records Between ' + minDt + ' and ' + maxDt
    subtitle = subtitle + ': ' + fitlerCategory
    return <div key={columnFilterName}>{subtitle}</div>
  }

  filterNumbers (columnFilter, columnFilterName) {
    let subtitle = ''
    let fitlerCategory
    let numList = columnFilter.options.nextRange
    let start = numList[0]
    let end = numList[1]
    subtitle = 'Filtering by ' + titleize(columnFilterName)
    fitlerCategory = 'Only Showing Records with Values Between ' + start + ' and ' + end
    subtitle = subtitle + ': ' + fitlerCategory
    return <div key={columnFilterName}>{subtitle}</div>
  }

  buildSubTitle (filters, columns) {
    const builders = {
      'category': this.filterCategories,
      'booleanCategory': this.filterCategories,
      'numericRange': this.filterNumbers,
      'dateRange': this.filterDates
    }

    let subtitle
    if (!isEmpty(filters)) {
      let filterKeys = Object.keys(filters)
      subtitle = filterKeys.map((key) => {
        let filter = filters[key]
        let column = columns[key] || null
        let columnName = column !== null ? column.name : 'Boolean Fields'
        if (!isEmpty(filter) && filter.options.selected !== null) {
          return builders[filter.options.filterType](filter, columnName)
        }
        return null
      })
    }
    return subtitle
  }
  render () {
    let {filters, columns} = this.props
    let subtitleStuff = this.buildSubTitle(filters, columns)
    return (
      <div className={'Chart__sub-title'}>{subtitleStuff}</div>
    )
  }
}

ChartExperimentalSubTitle.propTypes = {
  columns: PropTypes.object,
  filters: PropTypes.object
}

export default ChartExperimentalSubTitle
