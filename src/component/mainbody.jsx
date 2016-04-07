import React from 'react';
import { Menu, Icon ,Tabs } from 'antd';
import './mainbody.less';
const SubMenu = Menu.SubMenu; //下级菜单
const TabPane = Tabs.TabPane; //11

{/* //顶部头部组件 */}
const MAINBODY_HEADER= React.createClass({
  render() {
    return (
      <div id="header-wrapper" onClick={this.props.onClick}></div>
    )
  }
});



{/* //标签页组件 */}
const MAINBODY_CONTENT_TABS = React.createClass({
  getInitialState() {
    tabs:this.props.tabs_card;
    this.newTabIndex = 0;
    const panes = this.props.tabs_card.map(function(item){
      return (<TabPane tab={item.title} key={item.key}>选项卡一内容</TabPane>)
    });
    console.log(panes);
    return {
      activeKey: panes[0].key,
      panes,
    };
  },
  onChange(activeKey) {
    this.setState({ activeKey });
  },
  onEdit(targetKey, action) {
    this[action](targetKey);
  },
  add() {
    const panes = this.state.panes;
    const activeKey = `newTab${this.newTabIndex++}`;
    panes.push(<TabPane tab="新建页签" key={activeKey}>新页面</TabPane>);
    this.setState({ panes, activeKey });
  },
  remove(targetKey) {
    let activeKey = this.state.activeKey;
    let lastIndex;
    this.state.panes.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const panes = this.state.panes.filter(pane => pane.key !== targetKey);
    if (lastIndex >= 0 && activeKey === targetKey) {
      activeKey = panes[lastIndex].key;
    }
    this.setState({ panes, activeKey });
  },
  render() {
    return (
      <Tabs onChange={this.onChange} activeKey={this.state.activeKey}
        type="editable-card" onEdit={this.onEdit}>
        {this.state.panes}
      </Tabs>
    );
  }
});


{/* //主体显示数据区域组件 */}
const MAINBODY_CONTENT= React.createClass({
  render() {
    return (
      <div id="content-wrapper">
        <div id="main-body-content"><MAINBODY_CONTENT_TABS tabs_card={this.props.tabs_card}/></div>
      </div>
    )
  }
});



{/* //左侧菜单组件 */}
const MAINBODY_MENU= React.createClass({
  getInitialState() {
      return {
        current: '1',
        openKeys: [],
        menu_data:this.props.menu_item
      }
    },
    handleClick(e) {
      console.log(e.item.props.url);
      this.setState({
        current: e.key,
        openKeys:e.keyPath.slice(1)
      });
    },
    onToggle(info) {
      this.setState({
        openKeys: info.open ? info.keyPath : info.keyPath.slice(1)
      });
    },
  render() {
   let handlemenuClick=this.handlemenuClick;
   let menu_content,menu_item_content;
   menu_content = this.state.menu_data.map(function (item) {
     menu_item_content=item.contain.map(function (contain_item) {
       return (
         <Menu.Item key={contain_item.key} url={contain_item.url} ><div className="mainbody-menu-item">{contain_item.name}</div></Menu.Item>
       )
     });
     return (
       <SubMenu key={ item.key } title={<span><Icon type={ item.icon } /><span>{ item.title }</span></span>} >
            { menu_item_content }
       </SubMenu>
     )
  });
    return (
    <div>
      <div id="sidebar-wrapper">
        <div id="menu-wrapper">
          <Menu onClick={this.handleClick}
            style={{ width: 240 }}
            openKeys={this.state.openKeys}
            onOpen={this.onToggle}
            onClose={this.onToggle}
            selectedKeys={[this.state.current]}
            mode="inline" >
          { menu_content }
          </Menu>
        </div>
      </div>
    </div>
    )
  }
});

{/* //整个页面主体框架组件 */}
const MAINBODY= React.createClass({
  getInitialState() {
      return {
        tabs_data:[{
          'title':'首页',
          'url':'#',
          'key':1
        },{
          'title':'222',
          'url':'#',
          'key':2
        }],
        menu_data: [{
          'key': 'sub1',
          'title': '菜单1',
          'icon': 'appstore',
          'contain': [{
            'name': '表格1',
            'url': '#1',
            'key': '1'
          },{
            'name': '表格2',
            'url': '#2',
            'key': '2'
          }]
        },{
          'key': 'sub2',
          'title': '菜单2',
          'icon': 'mail',
          'contain': [{
            'name': '表格1',
            'url': '#1',
            'key': '1'
          },{
            'name': '表格2',
            'url': '#2',
            'key': '2'
          }]
        }]
      }
    },
    handleOk(){
      this.setState({
        tabs_data:[{
          'title':'首页22',
          'url':'#',
          'key':111
        }]
      });
    console.log(this.state.tabs_data);
    },
  render() {
    return (
      <div>
        <MAINBODY_HEADER onClick={this.handleOk}></MAINBODY_HEADER>
        <MAINBODY_MENU menu_item={this.state.menu_data}></MAINBODY_MENU>
        <MAINBODY_CONTENT tabs_card={this.state.tabs_data}></MAINBODY_CONTENT>
      </div>
    )
  }
});
export default MAINBODY;
