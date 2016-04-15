import React from 'react';
/*import所有用到的页面*/
 import Employee from '../web/employee.jsx';
 import Device from '../web/device.jsx';
 import DevType from '../web/devtype.jsx';
//下面根据标签页面显示内容
const TabsContent= React.createClass({
  getInitialState() {
    return{
      component:this.props.component
    }
  },
  propTypes: {
   component: React.PropTypes.string.isRequired,
  },
  render() {
    switch(this.state.component){
      case "employee":
        return (
          <Employee/>
        )
      break;
      case "device":
        return (
          <Device/>
        )
      break;
      case "devtype":
        return (
          <DevType/>
        )
      break;
    }
  }
});
export default TabsContent;
