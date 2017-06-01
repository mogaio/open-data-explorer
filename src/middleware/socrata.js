import soda from 'soda-js'
import _ from 'lodash'
import uniq from 'lodash/uniq'
import { replacePropertyNameValue } from '../helpers'
import moment from 'moment'
import d3 from 'd3'
import { sumObj, sortObj } from '../helpers'

const API_ROOT = 'https://data.sfgov.org/'

// Export constants
export const Endpoints = {
  METADATA: endpointMetadata,
  COLUMNS: endpointColumns,
  QUERY: endpointQuery,
  TABLEQUERY: endpointTableQuery,
  COUNT: endpointCount,
  MIGRATION: endpointApiMigration,
  COLPROPS: endpointColumnProperties
}

export const Transforms = {
  METADATA: transformMetadata,
  COLUMNS: transformColumns,
  QUERY: transformQueryData,
  TABLEQUERY: transformTableQuery,
  COUNT: transformCount,
  MIGRATION: transformApiMigration,
  COLPROPS: transformColumnProperties
}

export const shouldRunColumnStats = (type, key) => {
  /*
   * below is a bit of a hack to get around the fact that some categorical fields are encoded as numbers on the portal
   * we don't want to run column stats against all numeric columns, so this allows us to control that, the regex below may need to be
   * tuned as is, it could create false positives. This is okay for now, something we can optimize later
  */
  let regex = /(year|day|date|month|district|yr|code|id|x|y|lat|lon)/g
  let isCategorical = regex.test(key)
  if (type === 'text' || (isCategorical && type === 'number')) {
    return true
  } else {
    return false
  }
}

// Construct URL based on chart options
// TODO - break into smaller functions

function constructQuery (state) {
  let columns = state.columnProps.columns
  let { selectedColumn, dateBy, groupBy, sumBy, filters } = state.query

  let columnType = columns[selectedColumn].type
  let isCategory = (columns[selectedColumn].categories)

  let consumerRoot = API_ROOT.split('/')[2]
  let consumer = new soda.Consumer(consumerRoot)
  let id = state.metadata.dataId || state.metadata.id
  let query = consumer.query().withDataset(id)

  let dateAggregation = dateBy === 'month' ? 'date_trunc_ym' : 'date_trunc_y'
  let selectAsLabel = selectedColumn + ' as label'
  let orderBy = 'value desc'
  if (columnType === 'date') {
    selectAsLabel = dateAggregation + '(' + selectedColumn + ') as label'
    orderBy = 'label'
  } else if (columnType === 'number' && !isCategory) {
    orderBy = 'label'
  }

  if (groupBy) {
    orderBy = groupBy
    if (columns[groupBy].type === 'date') {
      groupBy = 'date_trunc_y(' + groupBy + ') as date_group_by'
      orderBy = 'date_group_by'
    }
    query.select(groupBy).group(orderBy)
  }

  let base = 'count(*) as value'
  let sumByQry = selectAsLabel + ', sum(' + sumBy + ') as value'

  if (sumBy) {
    query.select(sumByQry)
      .group('label')
      .order(orderBy)
      .where(sumBy + ' is not null')
  } else {
    query = query.select(base)
      .select(selectAsLabel)
      .group('label')
      .order(orderBy)
  }

  // Where (filter)
  if (columnType === 'date' || (columnType === 'number' && !isCategory)) query = query.where('label is not null')
  if (filters) {
    for (let key in filters) {
      let column = key !== 'booleans' ? columns[key] : {type: 'boolean'}
      let filter = filters[key]

      if (filter.options && column.type === 'date') {
        let start = filter.options.min.format('YYYY-MM-DD')
        let end = filter.options.max.format('YYYY-MM-DD')
        query.where(key + '>="' + start + '" and ' + key + '<="' + end + '"')
      } else if (column.categories && filter.options && filter.options.selected) {
        let enclose = '"'
        let joined = [].concat(filter.options.selected)
        let selectedCount = joined.length
        let blankIdx = joined.indexOf('blank')
        let queryNull = ''

        if (blankIdx > -1) {
          joined.splice(blankIdx, 1)
          queryNull = key + ' is null'
        }

        if (selectedCount > 1) {
          queryNull = queryNull !== '' ? queryNull + ' or ' : ''
          joined = joined.join(enclose + ' or ' + key + '=' + enclose)
          query.where(queryNull + key + '=' + enclose + joined + enclose)
        } else if (selectedCount === 1) {
          let whereString = queryNull !== '' ? queryNull : key + '=' + enclose + joined + enclose
          query.where(whereString)
        }
      } else if (column.type === 'boolean' && filter.options && filter.options.selected) {
        let join = filter.options.join || 'or'
        let joined = filter.options.selected.join(' ' + join + ' ')
        query.where(joined)
      } else if (column.type === 'number' && !column.categories && filter.options && filter.options.currentRange) {
        let first = parseInt(filter.options.currentRange[0], 10)
        let last = parseInt(filter.options.currentRange[1], 10)
        query.where(key + '>=' + first + ' and ' + key + '<=' + last)
      }
    }
  }
  query = query.limit(9999999)
  return query.getURL()
}

// Endpoints

function endpointApiMigration (id) {
  return API_ROOT + `api/migrations/${id}.json`
}

function endpointMetadata (id) {
  return API_ROOT + `api/views/${id}.json`
}

function endpointCount (id) {
  return API_ROOT + `resource/${id}.json?$select=count(*)`
}

function endpointQuery (state) {
  return constructQuery(state)
}

function endpointColumns (id) {
  return API_ROOT + `resource/cq5k-ka7d.json?$where=datasetid='${id}'`
}

function endpointTableQuery (state) {
  let consumerRoot = API_ROOT.split('/')[2]
  let consumer = new soda.Consumer(consumerRoot)
  let id = state.metadata.dataId || state.metadata.id
  let table = state.metadata.table
  let page = table.tablePage || 0

  let query = consumer.query()
    .withDataset(id)
    .limit(1000)
    .offset(1000 * page)

  if (table.sorted && table.sorted.length > 0) {
    table.sorted.forEach((key) => {
      query.order(key + ' ' + state.metadata.columns[key].sortDir)
    })
  }

  return query.getURL()
}

function endpointColumnProperties (id, key) {
  let category = key + ' as category'
  if (key === 'category') {
    category = key
  }
  return API_ROOT + `resource/${id}.json?$select=${category},count(*)&$group=category&$order=category asc&$limit=50000`
}

// Transforms

function transformMetadata (json) {
  let metadata = {
    id: json['id'],
    dataId: json['id'],
    name: json['name'],
    description: json['description'],
    type: json['viewType'],
    createdAt: json['createdAt'],
    rowsUpdatedAt: json['rowsUpdatedAt'],
    viewModifiedAt: json['viewLastModified'],
    licenseName: json.license.name || null,
    licenseLink: json.license.termsLink || null,
    publishingDepartment: json.metadata.custom_fields['Department Metrics']['Publishing Department'] || null,
    publishingFrequency: json.metadata.custom_fields['Publishing Details']['Publishing frequency'] || null,
    dataChangeFrequency: json.metadata.custom_fields['Publishing Details']['Data change frequency'] || null,
    notes: json.metadata.custom_fields['Detailed Descriptive']['Data notes'] || null,
    programLink: json.metadata.custom_fields['Detailed Descriptive']['Program link'] || null,
    rowLabel: json.metadata.rowLabel || 'Record',
    tags: json.tags || null,
    category: json['category'] || 'dataset',
    columns: {}
  }

  if (json.viewType === 'geo') {
    metadata.dataId = json.childViews[0]
  }

  if (json.metadata.attachments) {
    metadata.attachments = json.metadata.attachments
  }

  for (let column of json.columns) {
    let typeCast = {
      'calendar_date': 'date',
      'currency': 'number',
      'money': 'number',
      'checkbox': 'boolean'
    }
    let type = typeCast[column['dataTypeName']] || column['dataTypeName']
    let format = column['dataTypeName']

    let col = {
      id: column['id'],
      key: column['fieldName'],
      name: column['name'].replace(/[_-]/g, ' '),
      description: column['description'] || '',
      type,
      format}

    if (column['cachedContents']) {
      col.non_null = column['cachedContents']['non_null'] || 0
      col.null = column['cachedContents']['null'] || 0
      col.count = col.non_null + col.null
      col.min = column['cachedContents']['smallest'] || null
      col.max = column['cachedContents']['largest'] || null
    }

    metadata.columns[column['fieldName']] = col
  }

  return metadata
}

function transformColumns (json) {
  let response = {}
  let columns = {}
  // for now, we'll have to refactor and bring consistency to this between our data dictionary work and the explorer
  let fieldTypeMap = {
    'numeric': 'number',
    'timestamp': 'date',
    'checkbox': 'boolean',
    'geometry: point': 'location'
  }

  for (let column of json) {
    let type = fieldTypeMap[column['field_type']] || column['field_type']
    columns[column['api_key']] = {
      id: column['columnid'],
      key: column['api_key'],
      name: column['field_name'].replace(/[_-]/g, ' '),
      alias: column['field_alias'] || '',
      description: column['field_definition'] || '',
      type
    }
  }
  response.columns = columns

  return response
}

// refactor
function reduceGroupedData (data, groupBy) {

  // collect unique labels
  let groupedData = uniq(data.map((obj) => {
    return obj['label']
  })).map((label) => {
    return {label: label}
  })

  let findInGroups = (i) => {
    return groupedData.findIndex((element, idx, array) => {
      return element['label'] === data[i]['label']
    })
  }

  // add columns to rows
  let i = 0
  let dataLength = data.length
  for (i; i < dataLength; i++) {
    let groupIdx = findInGroups(i)
    groupedData[groupIdx][data[i][groupBy]] = parseInt(data[i]['value'], 10)
  }

  return groupedData
}

function isDateColSelected(state){
  let selectedCol =  state.columnProps.columns[state.query.selectedColumn]
  if(selectedCol.type === 'date'){
    return true
  }
  return false
}

function getDateRange(json){
  let dateListJson = json.map(function(obj){
    return moment(obj.label, moment.ISO_8601).toISOString()
  })
  return dateListJson
}

function getDateGrp(state){
  if(state.query.hasOwnProperty('dateBy')){
    if(state.query.dateBy === 'month'){
      return 'month'
    }
  }
  return 'y'
}

function sortDateList(dateList){
  dateList.sort(function(a, b){
      let keyA = new Date(a.label),
        keyB = new Date(b.label);
      // Compare the 2 dates
      if(keyA < keyB) return -1;
      if(keyA > keyB) return 1;
      return 0
  })
  return dateList
}


function addMissingDates(json, state){
  if(isDateColSelected(state)){
    let startDate = moment(json[0]['label'], moment.ISO_8601);
    let endDate = moment(json[json.length - 1]['label'], moment.ISO_8601);
    let currentDate = startDate.clone()
    let dateList = []
    let dateBy = getDateGrp(state)
    while (currentDate.isBefore(endDate)) {
      let currDt = currentDate.toISOString()
      dateList.push(currDt)
      currentDate.add(1, dateBy)
    }
    dateList.push( endDate.toISOString())
    let jsonDts = getDateRange(json)
    let diff = _.difference(dateList, jsonDts)
    let jsonEmptyDates =  diff.map(function(diffDt){
      return makeEmptyDtChartData(diffDt, dateBy)
    })
    let fullDates =  json.concat(jsonEmptyDates)
    // sort the dates at the end
    return sortDateList(fullDates)
 }
 return json
}

function makeEmptyDtChartData(diffDt, dateBy){
  let sliceLen = 4
  if(dateBy === 'month'){
    sliceLen = 7
  }
  return {'label': diffDt, 'value':0, 'key': diffDt.slice(0,sliceLen) }
}


function formatJsonGrpBy (itemList, dateBy, isDateCol) {
    let newdict = {}
    let yrFormat = d3.time.format('%Y')
    let monthFormat = d3.time.format('%m-%Y')
    Object.keys(itemList).forEach(function (key, index) {
      if (key === 'label') {
        newdict[key] = String(itemList[key])
        if (newdict[key] === 'undefined') {
          newdict[key] = 'blank'
        }
      } else if (key === 'undefined') {
        newdict['blank'] = Number(itemList[key])
      } else {
        newdict[key] = Number(itemList[key])
      }
    })

    if (isDateCol) {
      let dt = newdict['label'].split('T')
      dt = dt[0].split('-')
      if (dateBy === 'month') {
        newdict['label'] = monthFormat(new Date(String(dt[0]), String(Number(dt[1]) - 1), String(dt[2])))
      } else {
        newdict['label'] = yrFormat(new Date(String(dt[0]), String(Number(dt[1]) - 1), String(dt[2])))
      }
    }
    return newdict
}

function castJsonGrpBy (json, state) {
    let formattedJson = []
    let dateBy = state.query.dateBy
    let isDtCol = isDateColSelected(state)
    for (let i = 0; i < json.length; i++) {
      let newdict = formatJsonGrpBy(json[i], dateBy, isDtCol)
      formattedJson.push(newdict)
    }
    return formattedJson
  }

function sortJsonGrpBy (json) {
    let sortedJsonGrp = []
    let grpSumDict = {}
    Object.keys(json).forEach(function (key, index) {
      grpSumDict[key] = sumObj(json[key], 'label')
    })
    let sorted = sortObj(grpSumDict)
    for (let i = 0; i < sorted.length; i++) {
      let idx = sorted[i][0]
      sortedJsonGrp.push(json[idx])
    }
    return sortedJsonGrp
  }


function formatJsonCol (itemList) {
    itemList = itemList.map(function (item, index) {
      item['key'] = String(item['label'])
      item['value'] = Number(item['value'])
      return item
    })
    return itemList
}

function   formatJsonDateCol (itemList, dateBy) {
    let yrFormat = d3.time.format('%Y')
    let monthFormat = d3.time.format('%m-%Y')
    itemList = itemList.map(function (item, index) {
      if (dateBy === 'month') {
        item['label'] = monthFormat(new Date(item['label']))
        item['key'] = monthFormat(new Date(item['label']))
      } else {
        item['label'] = yrFormat(new Date(item['label']))
        item['key'] = yrFormat(new Date(item['label']))
      }
      console.log(item)
      return item
    })
    return itemList
  }


function  castJson (json, state) {
    let formattedJson = []
    if (isDateColSelected(state)) {
      let dateBy = getDateGrp(state)
      formattedJson = formatJsonDateCol(json,dateBy)
    } else {
      formattedJson = formatJsonCol(json)
    }
    //formattedJson = formatBlankJson(formattedJson)
    //formattedJson = formatWhiteSpaceJson(formattedJson)
    return formattedJson
  }



function transformQueryData (json, state) {
  let { query } = state
  let groupKeys = []

  if (query.groupBy && json.length > 0) {
    groupKeys = uniq(json.map((obj) => {
      return obj[query.groupBy]
    }))
    json = reduceGroupedData(json, query.groupBy)
    json = castJsonGrpBy(json, state)
    if(isDateColSelected(state)) {
      json =  sortDateList(json)
    }else{
      json = sortJsonGrpBy (json)
    }
  }
  if(json.length > 0){
    json = replacePropertyNameValue(json, 'label', 'undefined', 'blank')
    json = addMissingDates(json, state)
  }
  if(!query.groupBy){
      json =  castJson (json, state)
  }
  return {
    query: {
      isFetching: false,
      data: [],
      originalData: json,
      groupKeys: groupKeys
    }
  }
}

function transformTableQuery (json) {
  return {
    table: {
      isFetching: false,
      data: json
    }
  }
}

function transformCount (json) {
  return {rowCount: json[0].count}
}

function transformApiMigration (json) {
  return {dataId: json.nbeId}
}

function transformColumnProperties (json, state, params) {
  let maxRecord = parseInt(_.maxBy(json, function (o) { return parseInt(o.count, 10) },).count, 10)
  let checkFirst = maxRecord / state.metadata.rowCount
  let checkNumCategories = json.length / state.metadata.rowCount
  let transformed = {
    columns: {}
  }
  transformed.columns[params['key']] = {}
  if ((checkFirst <= 0.95 && checkFirst >= 0.05 && checkNumCategories <= 0.95) && maxRecord !== '1' && json.length !== 50000) {
    transformed.columns[params['key']].categories = json
    transformed.categoryColumns = [params['key']]
  } else if (maxRecord === 1) {
    transformed.columns[params['key']].unique = true
  }

  if (checkFirst === 1) {
    transformed.columns[params['key']].singleValue = true
  }

  return transformed
}
