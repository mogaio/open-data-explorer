import React from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'react-bootstrap'
import FieldColumns from '../components/FieldColumns'
import { filterColumnList, selectField, setHideShow, sortColumnList} from '../actions'
import { getUniqueColumnTypesDetails, getSelectableColumnsDetails, getSelectedFieldDef, getSelectedFieldDetails, getFieldProfileInfo} from '../reducers'
import DefaultListGroup from '../components/DefaultListGroup'
import FieldTypeButton from '../components/FieldTypeButton'
import FieldButton from '../components/FieldButton'
import HideShowButton from '../components/HideShowButton/'
import FieldNameFilterDetails from '../containers/FieldNameFilterDetails'
import { Panel } from 'react-bootstrap'
import FieldProfile from '../components/FieldProfile'

const ColumnDetails = ({list, filters, onFilter, sort, onSort, fieldTypeItems, selectableColumns, onSelectColumn, selectedColumnDef, hideshowVal, selectedField, setHideShow, showCols, selectedProfileInfo, selectedCategories }) => (
  <Row className={'column-details-all-container'}>
    <Col sm={3} className={'field-details-panel-picker-container'}>
    <div>
      <Choose>
        <When condition={selectedColumnDef}>
          <Choose>
          <When condition={showCols !== 'hide'}>
            <Panel collapsible defaultExpanded bsStyle='primary' header='Selected Field' className={'column-details-picker-panel'}>
              <DefaultListGroup
                itemComponent={FieldButton}
                items={selectedField}
                onSelectListItem={onSelectColumn}
                popOverPlacement={'right'} />
              <HideShowButton itemProps={{'value': hideshowVal, 'isSelected': showCols}} onClick={setHideShow} showCols={showCols} />
            </Panel>
          </When>
          <Otherwise>
            <Panel collapsible defaultExpanded bsStyle='primary' header='Selected Field' className={'column-details-picker-panel'}>
              <DefaultListGroup
                itemComponent={FieldButton}
                items={selectedField}
                onSelectListItem={onSelectColumn} />
              <DefaultListGroup
                itemComponent={FieldTypeButton}
                className={'default-list-group'}
                items={fieldTypeItems}
                onSelectListItem={onFilter} />
              <FieldNameFilterDetails />
              <DefaultListGroup
                itemComponent={FieldButton}
                items={selectableColumns}
                onSelectListItem={onSelectColumn}
                popOverPlacement={'right'} />
              <HideShowButton itemProps={{'value': hideshowVal, 'isSelected': showCols}} onClick={setHideShow} showCols={showCols} />
            </Panel>
          </Otherwise>
        </Choose>
      </When>
      <Otherwise>
        <Panel collapsible defaultExpanded header='Select a field' bsStyle={'primary'} className={'column-details-picker-panel'}>
          <DefaultListGroup
            itemComponent={FieldTypeButton}
            className={'default-list-group'}
            items={fieldTypeItems}
            onSelectListItem={onFilter} />
          <FieldNameFilterDetails />
          <DefaultListGroup
            itemComponent={FieldButton}
            items={selectableColumns}
            popOverPlacement={'right'}
            onSelectListItem={onSelectColumn} />
        </Panel>
      </Otherwise>
    </Choose>
  </div>
    </Col>
    <Col sm={9} className={'column-details-container-wrapper'}>
      <Choose>
        <When condition={selectedColumnDef}>
          <div className={'fieldProfileContainer'}>
            <FieldProfile
              field={selectedColumnDef}
              profileInfo={selectedProfileInfo}
              selectedCategories = {selectedCategories}
              onClick={ onSelectColumn.bind(this, '')} />
          </div>
        </When>
        <Otherwise>
          <div className={'columnDetailsContainer'}>
            <FieldColumns
            fieldList={list}
            sortBy={'type'}
            onClick={onSelectColumn}
            />
          </div>
        </Otherwise>
      </Choose>
    </Col>
  </Row>
)

const mapStateToProps = (state, ownProps) => {
  let selectable = getSelectableColumnsDetails(state)
  return {
    list: selectable  || {},
    fieldTypeItems: getUniqueColumnTypesDetails(state, true),
    selectableColumns: getSelectableColumnsDetails(state),
    selectedColumn: state.fieldDetailsProps.selectedColumn,
    selectedColumnDef: getSelectedFieldDef(state),
    selectedProfileInfo: getFieldProfileInfo(state),
    selectedField: getSelectedFieldDetails(state),
    hideshowVal: getSelectableColumnsDetails(state).length,
    showCols: state.fieldDetailsProps.showCols,
    selectedCategories: state.fieldDetailsProps.selectedCategories
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
  onSort: (sort) => dispatch(sortColumnList(sort)),
  onFilter: item => dispatch(filterColumnList('typeFilters', item, 'fieldDetailsProps')),
  onSelectColumn: (key) => dispatch(selectField(key)),
  setHideShow: showCols => dispatch(setHideShow(showCols, 'fieldDetailsProps')),
  resetState: resetState => dispatch(resetState('fieldDetailsProps'))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ColumnDetails)

