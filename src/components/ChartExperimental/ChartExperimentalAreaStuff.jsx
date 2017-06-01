import React, { Component } from 'react'
import PropTypes from 'prop-types'
import d3 from 'd3'
import { XAxis, AreaChart, YAxis, CartesianGrid, Area, Legend, Tooltip } from 'recharts'
import CustomYaxisLabel from './CustomYaxisLabel'
import CustomXaxisLabel from './CustomXaxisLabel'

class ChartExperimentalAreaStuff extends Component {

  makeAreas (groupKeys, grpColorScale) {
    let areas = []
    if (groupKeys) {
      if (groupKeys.length > 1) {
        let colorScale = d3.scale.linear().domain([1, groupKeys.length])
          .interpolate(d3.interpolateHcl)
          .range([d3.rgb(grpColorScale['start']), d3.rgb(grpColorScale['end'])])
        areas = groupKeys.map(function (i) {
          if (i) {
            let colorIndex = groupKeys.indexOf(i)
            return (
              <Area
                type='monotone'
                dataKey={i}
                stackId='i'
                key={i}
                stroke={colorScale('colorIndex')}
                fill={colorScale(colorIndex)} />)
          }
          return false
        })
        return areas
      }
    }
  }
  render () {
    let {h, w, isGroupBy, margin, yAxisWidth, rowLabel, groupKeys, fillColor, chartData, yTickCnt, grpColorScale, valTickFormater, domainMax, minTickGap, xAxisHeight, legendStyle, colName} = this.props
    let areas = this.makeAreas(groupKeys, grpColorScale)

    return (
      <Choose>
        <When condition={!isGroupBy}>
          <AreaChart
            width={w}
            height={h}
            data={chartData}
            margin={margin}>
            <XAxis
              dataKey='key'
              minTickGap={minTickGap}
              height={xAxisHeight}
              label={<CustomXaxisLabel val={colName} isGroupBy={isGroupBy} numOfGrps={0} />} />
            <YAxis
              width={yAxisWidth}
              tickFormatter={valTickFormater}
              tickCount={yTickCnt}
              domain={[0, domainMax]}
              type='number'
              label={<CustomYaxisLabel val={'Number of ' + rowLabel + 's'} h={h} />} />
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <Tooltip />
            <Area
              type='monotone'
              dataKey='value'
              stroke={fillColor}
              fill={fillColor} />
          </AreaChart>
        </When>
        <When condition={isGroupBy}>
          <AreaChart
            width={w}
            height={h}
            data={chartData}
            margin={margin}>
            <XAxis
              dataKey='label'
              height={xAxisHeight}
              minTickGap={minTickGap}
              label={<CustomXaxisLabel val={colName} isGroupBy={isGroupBy} numOfGrps={areas.length} />} />
            <YAxis
              tickFormatter={valTickFormater}
              tickCount={yTickCnt}
              domain={[0, domainMax]}
              type='number'
              label={<CustomYaxisLabel val={'Number of ' + rowLabel + 's'} h={h} />} />
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <Tooltip />
            <Legend wrapperStyle={legendStyle} />
            {areas}
          </AreaChart>
        </When>
      </Choose>
    )
  }
}

ChartExperimentalAreaStuff.propTypes = {
  chartData: PropTypes.array,
  h: PropTypes.number,
  w: PropTypes.number,
  chartProperties: PropTypes.object,
  isGroupBy: PropTypes.bool,
  margin: PropTypes.object,
  rowLabel: PropTypes.string,
  groupKeys: PropTypes.array,
  fillColor: PropTypes.string
}

export default ChartExperimentalAreaStuff
