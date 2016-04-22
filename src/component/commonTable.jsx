import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import { DatePicker,Row,Col,Form,Checkbox,Table,Modal,Input,Popconfirm,Icon,Button,Dropdown,Popover,Select } from 'antd';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
const FormItem = Form.Item;
const createForm = Form.create;
const InputGroup = Input.Group;
const confirm = Modal.confirm;






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
    PubSub.subscribe(this.props.paperName+"Reset",this.handleReset);
  },
  componentWillUnmount(){
    //退订事件
    PubSub.unsubscribe(this.props.paperName+'Reset');
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
    PubSub.subscribe(this.props.paperName+"Reset",this.handleButtonReset);
  },
  handleButtonReset() {
    this.props.form.resetFields();
  },
  handleSubmit(e) {
    e.preventDefault();
    let params=this.props.form.getFieldsValue();
    params.type='moreSearch';
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
        <Form inline  onSubmit={this.handleSubmit} >
          <FormItem
            label="选择性别：">
            <Select placeholder="请选择性别" style={{ width: 120 }} {...getFieldProps('FILTER_EMPL_SEX')}>
              <Option value="0">女</Option>
              <Option value="1">男</Option>
            </Select>
          </FormItem>
          <br/>
          <br/>
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

//表格操作栏
const Edit = React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false
    };
  },
  showModal() {
    this.setState({
      visible: true
    });
  },
  handleCancel() {
    this.setState({
      visible: false
    });
  },
  handleDelete() {
    let DELETE_PARAMS;
    DELETE_PARAMS[this.props.rowKey]=this.props[this.props.rowKey];
    DELETE_PARAMS[this.props.rowName]=this.props[this.props.rowName];
    confirm({
      title: '您是否确认要删除'+this.props[this.props.rowName],
      content: '',
      onOk() {
        //发布 删除 事件
        PubSub.publish(this.props.paperName+"Delete",DELETE_PARAMS);
      },
      onCancel() {}
    });
  },
  render() {
    return (
      <div>
        <a type="primary" onClick={this.showModal} {...this.props}>修改/查看</a>
          <span className="ant-divider"></span>
        <a type="primary" onClick={this.handleDelete}>删除</a>
          <span className="ant-divider"></span>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={'修改信息-'+this.props.EMPL_NAME}
          onCancel={this.handleCancel}
          footer={null} >

        </Modal>
      </div>
    );
  }
});


//新增添加 弹窗内容
let NewAddModalContent =React.createClass({
  getInitialState() {
    return {
    }
  },
  componentWillReceiveProps(){
    //每次打开还原表单的值
    if(this.props.visible==false){
      this.props.form.resetFields();
    }
  },
  handleSubmit(e) {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((errors, values) => {
      if (!!errors) {
        console.log('表单未通过验证!!!');
        return;
      }
      let params=values;
      //发布 新增 事件
      PubSub.publish(this.props.paperName+"Add",params);
      this.props.modalClose();
    });
  },
  handleCancel(){
    this.props.modalClose();
  },
  render() {
     const { getFieldProps, getFieldError, isFieldValidating } = this.props.form;
     return (
       /*表单下拉组件 的 value 一定要全等，才能正确显示*/
       <Form inline form={this.props.form}>
         <FormItem
           label="人员姓名："
           labelCol={{ span: 8 }}
           wrapperCol={{ span: 12 }}
           help={isFieldValidating('EMPL_NAME') ? '校验中...' : (getFieldError('EMPL_NAME') || []).join(', ')}>
         <Input placeholder="请输入姓名" {...getFieldProps('EMPL_NAME',{
             rules: [{ max: 24, message: '人员姓名至多为 24 个字符' },{ required: true,whitespace:true, message: '请输入姓名' },{validator: this.checkEmplName}]
         })} style={{ width: 163 }}/>
        </FormItem>
       <div className="ant-modal-footer FormItem-modal-footer">
           <Button type="ghost" className="ant-btn ant-btn-ghost ant-btn-lg" onClick={this.handleCancel}>取消</Button>
           <Button type="primary" className="ant-btn ant-btn-primary ant-btn-lg" onClick={this.handleSubmit}>确定</Button>
       </div>
      </Form>
    )
  }
});
NewAddModalContent = Form.create()(NewAddModalContent);

/*新增的弹窗*/
const NewAdd= React.createClass({
  getInitialState() {
    return {
      loading: false,
      visible: false
    };
  },
  showModal() {
    this.setState({
      visible: true
    });
  },
  handleCancel() {
    this.setState({
      visible: false
    });
  },
  render() {
    return (
      <div>
        <Button type="primary" onClick={this.showModal} className="table-add-btn">{this.props.text}<Icon type="plus-square" /></Button>
        <Modal ref="modal"
          width="550"
          visible={this.state.visible}
          title={this.props.text}
          onCancel={this.handleCancel}
          footer={null}>
          <NewAddModalContent
            visible={this.state.visible}
            modalClose={this.handleCancel}
            paperName={this.props.paperName}
          />
        </Modal>
      </div>
    );
  }
});




//标签分页里面的整个内容
const COMMONTABLE= React.createClass({
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
      url:web_config.http_request_domain+this.props.listUrl,
      method: 'POST',
      timeout :web_config.http_request_timeout,
      data:params,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        const pagination = this.state.pagination;
        pagination.total = result.data[this.props.tableData].count;
        pagination.current = result.data[this.props.tableData].currentPage;
        this.setState({
          loading: false,
          data: result.data[this.props.tableData].data,
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
  fetchEdit(){
    console.log('add');
  },
  componentDidMount() {
    this.fetchList();
    // 订阅 人员编辑 的事件
    PubSub.subscribe(this.props.paperName+"Add",this.fetchEdit);
  },
  render() {
    let newAddButton=(<div className="el-display-none"></div>);

    const FilterLayerContent= (
      <FilterLayer paperName={this.props.paperName} />
    );

    if(this.props.newAddButton==true){
      newAddButton= (
          <Col span="12" className="table-add-layer">
            <NewAdd
            text={this.props.newAddButtonText}
            paperName={this.props.paperName}
            /></Col>
      )
    }


    const columns=this.props.columns.map(function(item){
      let r=[];
      if(item.key=="operation"){
        r.push({
          title: '操作',
          key: 'operation',
          render(text, row, index) {
            return (
              /* 把所在的行的数据传递下去 */
              <Edit {...row} rowKey="EMPL_ID" rowName="EMPL_NAME" paperName='employee'/>
              );
            }
        });
      }else{
        r.push(item);
      };
      return r;
    });
console.log(columns);
    return (
    <div>
     <Row>
      <Col span="4"><SearchInput paperName={this.props.paperName} placeholder={this.props.defaultSearchPlaceholder}  /> </Col>
      <Col span="2" style={{marginLeft:-10}}>
        <Popover placement="bottom" visible={this.state.gaojisousuoVislble} onVisibleChange={this.fliterDisplayChange} overlay={FilterLayerContent} trigger="click">
            <Button type="primary" htmlType="submit" className="gaojibtn" >高级搜索</Button>
        </Popover>
      </Col>
      <Col span="1" style={{marginLeft:-20}}>
        <Button type="primary" htmlType="submit"  >重置</Button>
      </Col>
      { newAddButton }
     </Row>
        <div className="margin-top-10"></div>
        <Table columns={columns}
            dataSource={this.state.data}
            pagination={this.state.pagination}
            loading={this.state.loading}
            onChange={this.handleTableChange} /*翻页 筛选 排序都会触发 onchange*/
            size="middle"
            rowKey={record => record[this.props.rowKey]} /*指定每行的主键 不指定默认key*/
            bordered={true}
        />
   </div>
    );
  }
});



export default COMMONTABLE;
