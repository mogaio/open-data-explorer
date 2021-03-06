import React, { Component } from 'react'
import PropTypes from 'prop-types'
import d3 from 'd3'
import { XAxis, BarChart, YAxis, CartesianGrid, Bar, Legend, Tooltip } from 'recharts'
import CustomYaxisLabel from './CustomYaxisLabel'
import CustomXaxisLabel from './CustomXaxisLabel'
import CustomKeyAxisTick from './CustomKeyAxisTick'

class ChartExperimentalBarStuff extends Component {
  makeBars (groupKeys, grpColorScale) {
    let bars = []
    if (groupKeys) {
      if (groupKeys.length > 1) {
        let colorScale = d3.scale.linear().domain([1, groupKeys.length])
          .interpolate(d3.interpolateHcl)
          .range([d3.rgb(grpColorScale['start']), d3.rgb(grpColorScale['end'])])
        bars = groupKeys.map(function (i) {
          if (i) {
            let colorIndex = groupKeys.indexOf(i)
            return (
              <Bar
                dataKey={i}
                stackId='a'
                key={i}
                fill={colorScale(colorIndex)} />)
          }
          return false
        })
        return bars
      }
    }
  }

  getChartProperties (chartData) {
    let chartProperties = {}
    if (chartData) {
      chartProperties = {
        horizontal: false,
        vertical: true,
        manyBars: false,
        layout: 'horizontal'
      }
      if (chartData.length > 5) {
        chartProperties.layout = 'vertical'
        chartProperties.manyBars = true
      }
    }
    return chartProperties
  }
  setLegendStyleTop(bars, legendStyle){
    if(bars){
      if(bars.length <= 20){
        legendStyle.top = '-20%'
      }
      if(bars.length > 20 && bars.length <= 30){
        legendStyle.top = '-25%'
      }
      if(bars.length > 30 && bars.length <= 40){
        legendStyle.top = '-30%'
      }
      if(bars.length > 40 ){
        legendStyle.top = '-30%'
      }
    }
    return legendStyle
  }
  render () {
    let {h, w, xAxisInterval, xAxisPadding, isGroupBy, rowLabel, groupKeys, fillColor, chartData, yTickCnt, xTickCnt, valTickFormater, grpColorScale, colName, domainMax, isDateSelectedCol, legendStyle, xAxisHeight, yAxisWidth} = this.props
    let bars = this.makeBars(groupKeys, grpColorScale)
    let chartProperties = this.getChartProperties(chartData)
    let xpadding = {bottom: 300}
    legendStyle = this.setLegendStyleTop(bars, legendStyle)
    return (
      <Choose>
        <When condition={isDateSelectedCol}>
          <Choose>
            <When condition={!isGroupBy}>
              <BarChart
                width={w}
                height={h}
                data={chartData} >
                <XAxis
                  dataKey={'key'}
                  allowDataOverflow={true}
                  interval={xAxisInterval}
                  type={'category'}
                  tickSize={4}
                  padding={xAxisPadding}
                  label={<CustomXaxisLabel val={colName} isGroupBy={isGroupBy} numOfGroups={0} chartType={'line'} />}
                  height={xAxisHeight} />
                <YAxis
                  tickFormatter={valTickFormater}
                  tickCount={yTickCnt}
                  tickSize={3}
                  allowDataOverflow={true}
                  domain={[0, domainMax]}
                  type='number'
                  label={<CustomYaxisLabel val={'Number of ' + rowLabel + 's'} h={h} chartType={'line'} />} />
                  width={yAxisWidth}
                <CartesianGrid stroke='#eee'  strokeDasharray='3 3' vertical={false} />
                <Tooltip />
                <Bar dataKey='value' fill={fillColor} />
              </BarChart>
            </When>
            <Otherwise>
              <BarChart
                width={w}
                height={h}
                data={chartData}>
                <XAxis
                  dataKey={'label'}
                  type={'category'}
                  interval={xAxisInterval}
                  allowDataOverflow={true}
                  height={xAxisHeight}
                  tickSize={4}
                  label={<CustomXaxisLabel val={colName} isGroupBy={isGroupBy} numOfGrps={bars.length} chartType={'line'} />} />
                <YAxis
                  tickFormatter={valTickFormater}
                  tickCount={yTickCnt}
                  allowDataOverflow={true}
                  domain={[0, domainMax]}
                  width={yAxisWidth}
                  type={'number'}
                  label={<CustomYaxisLabel val={rowLabel + ' value'} h={h}   chartType={'line'} />} />
                <CartesianGrid stroke='#eee' strokeDasharray='3 3' vertical={false} />
                <Tooltip />
                <Legend wrapperStyle={legendStyle} />
                {bars}
              </BarChart>
            </Otherwise>
          </Choose>
        </When>
        <Otherwise>
          <Choose>
            <When condition={!isGroupBy && chartProperties.manyBars}>
              <BarChart
                width={w}
                height={h}
                layout={chartProperties.layout}
                data={chartData} >
                <XAxis
                  tickFormatter={valTickFormater}
                  type='number'
                  tickCount={xTickCnt}
                  padding={xpadding}
                  domain={[0, domainMax]}
                  label={<CustomXaxisLabel val={'Number of ' + rowLabel + 's'} isGroupBy={isGroupBy} numOfGrps={0} />}
                  height={xAxisHeight} />
                <YAxis
                  dataKey='key'
                  label={<CustomYaxisLabel val={colName} h={h} />}
                  type='category'
                  tick={< CustomKeyAxisTick />}
                  width={yAxisWidth} />
                <CartesianGrid stroke='#eee' strokeDasharray='3 3' horizontal={chartProperties.horizontal} vertical={chartProperties.vertical} />
                <Tooltip />
                <Bar dataKey='value' fill={fillColor} />
              </BarChart>
            </When>
            <When condition={!isGroupBy && !chartProperties.manyBars}>
              <BarChart
                width={w}
                height={h}
                data={chartData}>
                <XAxis
                  dataKey='key'
                  type='category'
                  label={<CustomXaxisLabel val={colName} isGroupBy={isGroupBy} numOfGroups={0} />}
                  height={xAxisHeight} />
                <YAxis
                  tickFormatter={valTickFormater}
                  tickCount={yTickCnt}
                  domain={[0, domainMax]}
                  type='number'
                  width={yAxisWidth}
                  label={<CustomYaxisLabel val={'Number of ' + rowLabel + 's'} h={h} />} />
                <CartesianGrid stroke='#eee' strokeDasharray='3 3' vertical={false} />
                <Tooltip />
                <Bar dataKey='value' fill={fillColor} />
              </BarChart>
            </When>
            <When condition={isGroupBy && chartProperties.manyBars}>
              <BarChart
                width={w}
                height={h}
                layout={chartProperties.layout}
                data={chartData}>
                <XAxis
                  tickFormatter={valTickFormater}
                  tickCount={yTickCnt}
                  height={xAxisHeight}
                  domain={[0, domainMax]}
                  type='number'
                  label={<CustomXaxisLabel val={'Number of ' + rowLabel + 's'} isGroupBy={isGroupBy} numOfGrps={bars.length} />} />
                <YAxis
                  dataKey='label'
                  width={yAxisWidth}
                  tick={< CustomKeyAxisTick />}
                  label={<CustomYaxisLabel val={colName} h={h} />}
                  type='category' />
                <CartesianGrid stroke='#eee' strokeDasharray='3 3' horizontal={chartProperties.horizontal} vertical={chartProperties.vertical} />
                <Tooltip />
                <Legend wrapperStyle={legendStyle} />
                {bars}
              </BarChart>
            </When>
            <When condition={isGroupBy && !chartProperties.manyBars}>
              <BarChart
                width={w}
                height={h}
                data={chartData}>
                <XAxis
                  dataKey='label'
                  type='category'
                  height={xAxisHeight}
                  label={<CustomXaxisLabel val={colName} isGroupBy={isGroupBy} numOfGrps={bars.length} />} />
                <YAxis
                  tickFormatter={valTickFormater}
                  tickCount={yTickCnt}
                  domain={[0, domainMax]}
                  type='number'
                  width={yAxisWidth}
                  label={<CustomYaxisLabel val={'Number of ' + rowLabel + 's'} h={h} />} />
                <CartesianGrid  stroke='#eee' strokeDasharray='3 3' vertical={false} />
                <Tooltip />
                <Legend wrapperStyle={legendStyle} />
                {bars}
              </BarChart>
            </When>
          </Choose>
        </Otherwise>
      </Choose>
    )
  }
}

ChartExperimentalBarStuff.propTypes = {
  chartData: PropTypes.array,
  h: PropTypes.number,
  w: PropTypes.number,
  isGroupBy: PropTypes.bool,
  margin: PropTypes.object,
  rowLabel: PropTypes.string,
  groupKeys: PropTypes.array,
  fillColor: PropTypes.string
}

export default ChartExperimentalBarStuff
