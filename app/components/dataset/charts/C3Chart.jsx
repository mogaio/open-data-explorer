const React = require('react')
const _ = require('lodash')

const c3 = require('c3')
// const d3 = require("d3")

let C3Chart = React.createClass({
  displayName: 'C3Chart',
  propTypes: {
    type: React.PropTypes.string.isRequired,
    data: React.PropTypes.array.isRequired,
    options: React.PropTypes.shape({
      padding: React.PropTypes.shape({
        top: React.PropTypes.number,
        bottom: React.PropTypes.number,
        left: React.PropTypes.number,
        right: React.PropTypes.number
      }),
      size: React.PropTypes.shape({
        width: React.PropTypes.number,
        height: React.PropTypes.number,
      }),
      labels: React.PropTypes.bool,
      onclick: React.PropTypes.func,
      axisLabel: React.PropTypes.shape({
        x: React.PropTypes.string,
        y: React.PropTypes.string
      }),
      subchart: React.PropTypes.bool,
      zoom: React.PropTypes.bool,
      grid: React.PropTypes.shape({
        x: React.PropTypes.bool,
        y: React.PropTypes.bool
      })
    })
  },

  chart: null,

  setChart: function (chart) {
    this.chart = chart
  },

  getChart: function () {
    return this.chart
  },

  // color theme
  colors: function (count) {
    let colors = []
    // let color = d3.scale.category10()
    let color = this.props.colors
    for (let i = 0; i < count; i++) {
      colors.push(color[i])
    }
    return colors
  },

  // apply props.options to graph json
  graphObject: function () {
    let {options, data} = this.props
    let graphObject = {
      data: {},
      axis: {},
      bindto: '#chartContainer',
      color: {
        pattern: this.colors(50)
      }
    }

    if (options.padding) {
      graphObject.padding = {
        top: options.padding.top,
        left: options.padding.left,
        right: options.padding.right,
        bottom: options.padding.bottom
      }
    }
    if (options.stacked) {
      graphObject.data.groups = [this.multiDmsGroups(this.props.data)]
    }
    if (options.rotated) {
      graphObject.axis.rotated = true
    }
    if (options.size) {
      graphObject.size = {
        width: options.size.width,
        height: options.size.height
      }
    }
    if (options.labels) {
      graphObject.data.labels = options.labels
    }
    if (options.onClick) {
      graphObject.data.onclick = options.onClick
    }
    if (options.axisLabel) {
      graphObject.axis.x = {label: options.axisLabel.x}
      graphObject.axis.y = {label: options.axisLabel.y}
    }
    if (options.timeseries) {
      let format = '%Y'
      if (Array.isArray(data[0])) {
        format = data[0][1].substring(0, 4) === data[0][2].substring(0, 4) ? '%m/%Y' : '%Y'
      } else {
        format = data[0].values[0].label.substring(0, 4) === data[0].values[1].label.substring(0, 4) ? '%m/%Y' : '%Y'
      }
      graphObject.data.xFormat = '%Y-%m-%dT%H:%M:%S.%L'
      graphObject.axis.x =
        {type: 'timeseries', tick: { culling: true, format: format}
      }
    }
    if (options.subchart) {
      graphObject.subchart = {show: options.subchart}
    }
    if (options.zoom) {
      graphObject.zoom = {enabled: options.zoom}
    }
    if (options.grid) {
      graphObject.grid = {
        x: {show: options.grid.x},
        y: {show: options.grid.y}
      }
    }
    return graphObject
  },

  // c3.js
  drawGraph: function () {
    let multi = false
    if (this.props.data.length > 1) {
      multi = true
    }
    switch (this.props.type) {
      case 'line':
        this.setChart(this.drawGraphLineOrArea(false, multi))
        break
      case 'area':
        this.setChart(this.drawGraphLineOrArea(true, multi))
        break
      case 'bar':
        this.setChart(this.drawGraphBar(multi))
        break
      case 'pie':
        this.setChart(this.drawGraphPie())
        break
      case 'multiBar':
        this.setChart(this.drawGraphMultiBar(false))
        break
      case 'multiBarGroup':
        this.setChart(this.drawGraphMultiBar(true))
        break
      case 'lineBar':
        this.setChart(this.drawGraphlLineBar())
        break
    }
  },

  drawGraphLineOrArea: function (area, multi) {
    let graphObject = this.graphObject()
    let graphObjectData = {}
    if (multi) {
      graphObjectData = {
        x: 'x',
        columns: Array.isArray(this.props.data[0]) ? this.props.data : this.multiDmsDataPreparator(this.props.data)
      }
    } else {
      graphObjectData = {
        json: this.props.data[0].values,
        keys: { x: 'label', value: ['value'] },
        names: { value: this.props.data[0].key }
      }
    }
    if (area && this.props.data.length === 1) {
      graphObjectData.type = 'area'
    }

    let graphObjectAxis = {
      x: { type: 'category' } // this needed to load string x value
    }
    if (graphObject.axis.x.type && graphObject.axis.x.type === 'timeseries') {
      graphObjectAxis = {}
    }

    graphObject.data = _.merge(graphObjectData, graphObject.data)
    graphObject.axis = _.merge(graphObjectAxis, graphObject.axis)

    let chart = c3.generate(graphObject)
    return chart
  },

  drawGraphBar: function (multi) {
    let graphObject = this.graphObject()
    let graphObjectData = {
      x: 'x',
      type: 'bar'
    }
    if (!multi) {
      graphObjectData = _.merge(graphObjectData, {
        json: this.props.data[0].values,
        keys: { x: 'label', value: ['value'] },
        names: { value: this.props.data[0].key }
      })
    } else {
      graphObjectData = _.merge(graphObjectData, {
        columns: Array.isArray(this.props.data[0]) ? this.props.data : this.multiDmsDataPreparator(this.props.data)
      })
    }
    let graphObjectAxis = {
      x: { type: 'category' } // this needed to load string x value
    }
    if (graphObject.axis.rotated) {
      var xWidth = {
        x: {
          tick: {
            width: graphObject.padding.left
          }
        }
      }
      graphObjectAxis = _.merge(xWidth, graphObjectAxis)
    }

    graphObject.data = _.merge(graphObjectData, graphObject.data)
    graphObject.axis = _.merge(graphObjectAxis, graphObject.axis)

    let chart = c3.generate(graphObject)
    return chart
  },

  pieChartDataPreparator: function (rawData) {
    let data
    data = _.map(rawData, (d) => {
      return [d.label, d.value]
    })
    return data
  },

  drawGraphPie: function () {
    let graphObject = this.graphObject()
    let graphObjectData = {
      columns: this.pieChartDataPreparator(this.props.data[0].values),
      type: 'pie'
    }

    graphObject.data = _.merge(graphObjectData, graphObject.data)

    let chart = c3.generate(graphObject)
    return chart
  },

  multiDmsDataPreparator: function (rawData) {
    let xLabels = ['x'] // to make ['x', 'a', 'b', 'c' ...] for labels
    _.map(rawData[0].values, (d) => {
      xLabels.push(d.label)
    })

    let data, total

    // total for % calcs
    total = rawData.reduce((prev, curr) => {
      let sum = 0
      curr.values.reduce((p, c) => {
        sum += parseInt(c.value)
      }, 0)
      return prev + sum
    }, 0)

    data = _.map(rawData, (datum) => {
      let row = [datum.key]; // to make ['key', 30, 200, 100, 400 ...] for each row
      _.map(datum.values, (d) => {
        row.push(d.value)
      })
      return row
    })
    data.push(xLabels)
    return data
  },

  multiDmsGroups: function (rawData) {
    let groups
    if (Array.isArray(rawData[0])) {
      groups = _.map(rawData, (datum) => {
        if (datum[0] === 'x') {
          return false
        } else {
          return datum[0]
        }
      })
    } else {
      groups = _.map(rawData, (datum) => {
        return datum.key
      })
    }

    return groups
  },

  drawGraphMultiBar: function (group) {
    let graphObject = this.graphObject()
    let graphObjectData = {
      x: 'x',
      columns: this.multiDmsDataPreparator(this.props.data),
      type: 'bar'
    }
    let graphObjectAxis = {
      x: { type: 'category' } // this needed to load string x value
    }

    if (group) {
      graphObjectData.groups = [this.multiDmsGroups(this.props.data)]
    }

    if (graphObject.axis.rotated) {
      var xWidth = {
        x: {
          tick: {
            width: graphObject.padding.left
          }
        }
      }
      graphObjectAxis = _.merge(xWidth, graphObjectAxis)
    }

    graphObject.data = _.merge(graphObjectData, graphObject.data)
    graphObject.axis = _.merge(graphObjectAxis, graphObject.axis)

    let chart = c3.generate(graphObject)
    return chart
  },

  drawGraphlLineBar: function () {
    let graphObject = this.graphObject()
    let graphObjectData = {
      x: 'x',
      columns: this.multiDmsDataPreparator(this.props.data),
      types: {dataSource1: 'bar'},
    }
    let graphObjectAxis = {
      x: { type: 'category' } // this needed to load string x value
    }

    graphObject.data = _.merge(graphObjectData, graphObject.data)
    graphObject.axis = _.merge(graphObjectAxis, graphObject.axis)

    let chart = c3.generate(graphObject)
    return chart
  },

  componentDidMount: function () {
    this.drawGraph()
  },

  componentDidUpdate: function () {
    this.drawGraph()
    let chart = this.getChart()
    if (this.props.order.length > 0) {
      let show = (this.props.viewOption === 'top' ? this.props.order.slice(0, 5) : (this.props.viewOption === 'bottom' ? this.props.order.slice(-5) : this.props.order))
      chart.hide()
      this.props.viewOption === 'compare' ? chart.show() : chart.show(show)
    }
  },

  render: function () {
    return (
    <div>
      <div id="chartContainer"></div>
    </div>)
  }
})

module.exports = C3Chart