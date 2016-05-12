import React from 'react';
import reqwest from 'reqwest';
import { DatePicker,Row,Col,Form,Table,Input,Icon,Button,Popover,Select } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const RangePicker = DatePicker.RangePicker;



//指定表格每列内容
const columns = [{
  title: '帐号',
  dataIndex: 'OPER_ACCOUNT',
  sorter: true
},{
  title: '时间',
  dataIndex: 'OPLG_DATE',
  render(text, row, index) {
      return commonFunction.formatTime(row.OPLG_DATE,"yyyy-MM-dd hh:mm:ss");
  },
  sorter: true
},{
  title: '内容',
  dataIndex: 'OPLG_INFO',
  sorter: true
},{
  title: '结果',
  dataIndex: 'OPLG_RESULT',
  render(text, row, index) {
    switch(row.OPLG_RESULT){
      case 1:
        return '失败';
      break;
      case 0:
        return '成功';
      break;
    }
  },
  sorter: true
}];




//这里是默认简易的搜索
const SearchInput = React.createClass({
  getInitialState() {
    return {
      FILTER_KEY: '',
      focus: false,
    };
  },
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe("operatorlogReset",this.handleReset);
  },
  handleReset(){
    this.setState({
      FILTER_KEY:''
    });
  },
  handleInputChange(e) {
    this.setState({
      FILTER_KEY: e.target.value,
    });
  },
  handleFocusBlur(e) {
    this.setState({
      focus: e.target === document.activeElement,
    });
  },
  handleSearch(e) {
    let params={};
    params.FILTER_KEY=this.state.FILTER_KEY.trim();
    params.type="defaultSearch";
    if (this.props.onSearch) {
      this.props.onSearch(params);
    }
  },
  render() {
    const btnCls = classNames({
      'ant-search-btn': true,
      'ant-search-btn-noempty': !!this.state.FILTER_KEY.trim(),
    });
    const searchCls = classNames({
      'ant-search-input': true,
      'ant-search-input-focus': this.state.focus,
    });
    return (
      <InputGroup className={searchCls} style={this.props.style}>
        <Input {...this.props} value={this.state.FILTER_KEY} onChange={this.handleInputChange}
          onFocus={this.handleFocusBlur} onBlur={this.handleFocusBlur} />
          <div className="ant-input-group-wrap">
            <Button className={btnCls} size={this.props.size} onClick={this.handleSearch}>
              <Icon type="search" />
            </Button>
          </div>
        </InputGroup>
    );
  }
});





//这里是高级的搜索
let FilterLayer = React.createClass({
  getInitialState() {
    return {
    };
  },
  componentDidMount() {
    // 订阅 重置 的事件
    PubSub.subscribe("operatorlogReset",this.handleButtonReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe('operatorlogReset');
  },
  handleButtonReset() {
    this.props.form.resetFields();
  },
  handleSubmit(e) {
    e.preventDefault();
    let params=this.props.form.getFieldsValue();
    params.type='moreSearch';
    if(typeof params.FILTER_OPLG_DATE!='undefined'){
      params.FILTER_OPLG_START_TIME=commonFunction.formatTime(params.FILTER_OPLG_DATE[0],'yyyy-MM-dd hh:mm:ss');
      params.FILTER_OPLG_END_TIME=commonFunction.formatTime(params.FILTER_OPLG_DATE[1],'yyyy-MM-dd hh:mm:ss');
    }
    this.props.search(params);
    this.props.fliterhide();
  },
  handleReset(e) {
    e.preventDefault();
    this.props.form.resetFields();
  },
  render() {
    const { getFieldProps } = this.props.form;
    return (
      <div>
        <Form  inline onSubmit={this.handleSubmit} >
          <FormItem
            label="操作时间：">
            <RangePicker showTime format="yyyy/MM/dd HH:mm:ss" {...getFieldProps('FILTER_OPLG_DATE')} />
          </FormItem>
          <br/>
          <FormItem
            label="操作结果：">
            <Select placeholder="请选择操作结果" style={{ width: 340 }} {...getFieldProps('FILTER_OPLG_RESULT')}>
              <Option value="0">成功</Option>
              <Option value="1">失败</Option>
            </Select>
          </FormItem>
          <br/>
          <FormItem
            label="操作内容：">
            <Input placeholder="请输入操作内容搜索" {...getFieldProps('FILTER_OPLG_INFO')} style={{ width: 340 }}/>
          </FormItem>
          <div style={{ textAlign: 'right' }}>
              <Button size="small" type="primary" htmlType="submit">搜索</Button>
              <Button style={{ marginLeft: '10px' }} size="small" onClick={this.handleReset}>清除条件</Button>
          </div>
        </Form>
        </div>
    );
  }
});
FilterLayer = Form.create()(FilterLayer);







//标签分页里面的整个内容
const OperatorLog= React.createClass({
   getInitialState() {
    return {
      data: [],
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1,//页数
        size:'large',
        showTotal:function showTotal(total) {
            return `共 ${total} 条记录`;
        },
        showQuickJumper:true,
        // showSizeChanger :true
      },
      loading: false,
      gaojisousuoVislble:false
    };
  },
  handleTableChange(pagination, filters, sorter) {
    const pager = this.state.pagination;
    pager.current = pagination.current;
    this.setState({
      pagination: pager
    });
    const params = {
      type:'tableOnChange',
      pageSize: pagination.pageSize,
      current: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order
    };
    for (let key in filters) {
      if (filters.hasOwnProperty(key)) {
        params[key] = filters[key];
      }
    }
    this.fetchList(params);
  },
  fetchList(params = {}) {
    switch (params.type) {
      case undefined:
      case 'undefined':
        params=commonFunction.objExtend(params,this.state.pagination);
        break;
      case 'defaultSearch': //默认搜索行为
        this.state.defaultFilter=commonFunction.filterParamsObj(params);
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'moreSearch':    //高级搜索行为
        this.state.moreFilter=commonFunction.filterParamsObj(params);
        params=commonFunction.objExtend(params,this.state.defaultFilter);
        params=commonFunction.objExtend(params,{
          pageSize:10, //每页显示数目
          current:1//页数
        });
        break;
      case 'tableOnChange'://翻页排序等行为
        this.state.pagination={
          pageSize:params.pageSize,
          current:params.currentPage,
          sortField:params.sortField,
          sortOrder:params.sortOrder
        };
        params=commonFunction.objExtend(params,this.state.moreFilter);
        params=commonFunction.objExtend(params,this.state.defaultFilter);
        break;
      default:
        params=commonFunction.objExtend({},params);
    }
    this.setState({ loading: true });
    reqwest({
      url:web_config.http_request_domain+'/proc/operatorlog/list',
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:params,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        if(result.data.ERROR!=0){
          commonFunction.MessageTip(result.data.MSG,2,'error');
          this.setState({
            loading: false
          });
          return;
        }
        const pagination = this.state.pagination;
        pagination.total = result.data.O_OPERATORLOG.count;
        pagination.current = result.data.O_OPERATORLOG.currentPage;
        this.setState({
          loading: false,
          data: result.data.O_OPERATORLOG.data,
          pagination,
        });
      },
      error:()=>{
        commonFunction.MessageTip('获取数据失败',2,'error');
        this.setState({
          loading: false
        });
      }
    });
  },
  componentDidMount() {
    this.fetchList();
  },
  filterDisplay(){
      this.setState({
        gaojisousuoVislble:!this.state.gaojisousuoVislble
      });
  },
  fliterDisplayChange(e){
    this.setState({
      gaojisousuoVislble:e
    });
  },
  resetSearch(){
    this.setState({
      defaultFilter:{},
      moreFilter:{},
      pagination: {
        pageSize:10, //每页显示数目
        total:0,//数据总数
        current:1,//页数
        size:'large',
        showTotal:function showTotal(total) {
            return `共 ${total} 条记录`;
        },
        showQuickJumper:true
      }
    });
    PubSub.publish("operatorlogReset",{});
    this.fetchList({
      type:'reset',
      pageSize:10,
      current:1
    });
  },
  render() {
    const FilterLayerContent= (
      <FilterLayer search={this.fetchList} fliterhide={this.filterDisplay}/>
    );
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput placeholder="输入帐号搜索" onSearch={this.fetchList} /> </Col>
      <Col span="2" style={{marginLeft:-10}}>
        <Popover placement="bottom" visible={this.state.gaojisousuoVislble} onVisibleChange={this.fliterDisplayChange} overlay={FilterLayerContent} trigger="click">
            <Button type="primary" htmlType="submit" className="gaojibtn" >高级搜索</Button>
        </Popover>
      </Col>
      <Col span="1" style={{marginLeft:-20}}>
        <Button type="primary" htmlType="submit" onClick={this.resetSearch} >重置</Button>
      </Col>
     </Row>
        <div className="margin-top-10"></div>
        <Table columns={columns}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
            size="middle"
            rowKey={record => record.OPLG_ID} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default OperatorLog;
