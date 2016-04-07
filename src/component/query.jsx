import React from 'react';
import  { Row,Col,Form,Input,Button,Icon,QueueAnim,Table } from 'antd';
const FormItem = Form.Item;
const createForm = Form.create;
import './query.less';
let Query = React.createClass({
	getInitialState() {
		return{
			formData:this.props.formData
		}
	},
	getDefaultProps() {
		return{
			formData: {},
			submitName: "查询",
			onSubmit: formData => {console.log(formData)},
			onReset: ()=>{},
		}
	},
	componentWillMount(){
		this.handleClear() //立即重置表单, 获得表单默认值.
	},
	componentWillReceiveProps(nextProps) {
		let formData = this.state.formData;
		let children;
		if(!nextProps.children.length){
			children = [nextProps.children];
		} else{
			children = nextProps.children;
		}
            console.log(children)
		for(let child of children){
			if(child && (child.props["defaultValue"]?(child.props["value"] && child.props["value"] != formData[child.props["name"]] && child.props["value"] != child.props["defaultValue"]): child.props["value"] != formData[child.props["name"]])){
				formData[child.props["name"]] = child.props["value"];
			}
		}
		this.setState({formData:formData});
	},
	setValue(func,name,e) {
		let formData = this.state.formData;
		let value = e.target? e.target.value: e; //Input 传入的是e, select传入的是value
		formData[name] = value;
		this.setState({formData:formData});
		if(func)
			func(e);
	},
	handleSubmit(e) {
		e.preventDefault();
		this.props.onSubmit(this.state.formData);
	},
	handleClear (e){
		if(e) e.preventDefault();
		let formData={};
		let children = this.props.children;
		for(let i in children){
			if(children[i] && children[i].props){
				formData[children[i].props["name"]] = children[i].props["defaultValue"]?children[i].props["defaultValue"]:null;
			}
		}
		this.setState({formData:formData});
		this.props.onReset(e);
	},
    showfilter(){
        if(this.state.show){
              return 'filter-layer';
         }
     },
	render() {
		let formData = this.state.formData;

		let formEntity = [];
		let children;
		if(!this.props.children.length){
			children = [this.props.children];
		} else{
			children = this.props.children;
		}

		for(let i in children){ //遍历组件, 在这里将所有children变成受控组件.
			if(children[i]){
				let childName = children[i].props["name"];
				let injectProps = {
					onChange: this.setValue.bind(null, children[i].props["onChange"],
						children[i].props["name"])
				}
				if(1){ //注意, 这里不能使用this.state.formData.childName
					injectProps["value"] = this.state.formData[childName];
				}
				let child = React.cloneElement(children[i],injectProps);
				formEntity.push(<Col span="8" key={i}>
								<FormItem
							        label={children[i].props["label"] || children[i].props["labelName"]}
							        labelCol={{ span: 10 }}
							        wrapperCol={{ span: 14 }}>
							        {child}
							    </FormItem>
							</Col>
				);
			}
		}
		return(<div >
				<p className="buttons" style={{textAlign:"right",padding:10}}>
                    <Input name="name" placeholder="请输入搜索名称" label="搜索名称：" className="sousuo-input" />
		          <Button type="primary" onClick={()=>{this.setState({show:!this.state.show})}}>
					高级搜索 {this.state.show?<Icon type="minus-circle-o"/>:<Icon type="plus-circle"/>}
				  </Button>
		        </p>
		        <QueueAnim delay={100} type={["top"]} style={{paddingRight:15}} className={this.showfilter()}>
		        	{this.state.show ? [
					<Form horizontal key="dummy">
					  <Row>
					    {formEntity}
					  </Row>
					  <Row>
					    <Col span="8" offset="16" style={{ textAlign: 'right' }}>
					    	<Button type="ghost" onClick={this.handleClear} className="jl-right">清除条件</Button>
					    	<Button type="primary" onClick={this.handleSubmit}>{this.props.submitName}</Button>
					    </Col>
					  </Row>
					</Form>
					]:null}
				</QueueAnim>
			</div>)
	}
});

 const data=[{
      "key":0,
      "name":"test@example.com"
    },{
      "key":1,
      "name":"test@example.com"
    }];
 let table={
      data:data,
      totalCount:data.length,
      pageSize:10,
      currentPage:1,
      name:'name'
    }
const dataSource = [{
  key: '1',
  name: '胡彦斌',
  age: 32,
  address: '西湖区湖底公园1号'
}, {
  key: '2',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '3',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '4',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '5',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '6',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '7',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '8',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '9',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '10',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}, {
  key: '11',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}];

const columns = [{
  title: '姓名',
  dataIndex: 'name',
  key: 'name',
}, {
  title: '年龄',
  dataIndex: 'age',
  key: 'age',
}, {
  title: '住址',
  dataIndex: 'address',
  key: 'address',
}];
let fff= React.createClass({
      getInitialState() {
           return {
               formData:table,
               name:'name'
            }
        },

    	render() {
    return(
    <div>
     <Query>
        <Input name="name" placeholder="请输入搜索名称" label="搜索名称：" />
    </Query>
    <Table dataSource={dataSource} columns={columns} size='middle'/>
    </div>
    )}
 });


//Query = createForm()(Query);

export default fff;
