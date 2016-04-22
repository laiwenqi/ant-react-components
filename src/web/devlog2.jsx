import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { DatePicker,Row,Col,Form,Checkbox,Table,Modal,Input,Popconfirm,Icon,Button,Dropdown,Popover,Select } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import COMMONTABLE from '../component/commonTable.jsx';
import './employee.less';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;


//指定表格每列内容
const columns = [{
  title: '用户名',
  dataIndex: 'OPER_ACCOUNT',
  sorter: true
},{
  title: '姓名',
  dataIndex: 'EMPL_NAME',
  sorter: true
},{
  title: '联系电话',
  dataIndex: 'EMPL_MOBILE',
  render(text, row, index) {
    return row.EMPL_MOBILE==''?'暂无':row.EMPL_MOBILE;
  }
},{
  title: '操作',
  key: 'operation',
  render(text, row, index) {
    return (
      /* 把所在的行的数据传递下去 */
      <Edit {...row} rowKey="EMPL_ID" rowName="EMPL_NAME" paperName='employee'/>
      );
    }
}];




//标签分页里面的整个内容
const DevLog= React.createClass({
  getInitialState() {
    return {
    };
  },
  render() {
    const SelectList={
      role:'',
      organization:''
    }
    const SelectList2={
      role:'',
      organization:''
    }
    return (
      <COMMONTABLE
      paperName='employee'
      defaultSearchPlaceholder='输入用户名或姓名搜索'
      newAddButton={true}
      newAddButtonText='添加人员'
      listUrl="/proc/employee/list"
      tableData="O_T_EMPLOYEE"
      columns={columns}
      SelectList={SelectList}  //页面所用到的下拉选项
      rowKey="EMPL_ID"
      rowName="EMPL_NAME"
      />
    );
  }
});



export default DevLog;
