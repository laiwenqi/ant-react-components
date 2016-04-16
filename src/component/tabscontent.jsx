import React from 'react';
/*import所有用到的页面*/
 import Employee from '../web/employee.jsx';
 import Device from '../web/device.jsx';
 import DevType from '../web/devtype.jsx';
 import BusinessAndPayer from '../web/businessandpayer.jsx';
 import DeviceConfig from '../web/deviceconfig.jsx';
 import DevModel from '../web/devfittings.jsx';
 import DevFittings from '../web/devfittings.jsx';
 import DevLog from '../web/devlog.jsx';
 import OperatorLog from '../web/operatorlog.jsx';

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
        return (<Employee/>)
      break;
      case "device":
        return (<Device/>)
      break;
      case "devtype":
        return (<DevType/>)
      break;
      case "businessandpayer":
        return (<BusinessAndPayer/>)
      break;
      case "deviceconfig":
        return (<DeviceConfig/>)
      break;
      case "devmodel":
        return (<DevModel/>)
      break;
      case "devfittings":
        return (<DevFittings/>)
      break;
      case "operatorlog":
        return (<OperatorLog/>)
      break;
      case "devlog":
        return (<DevLog/>)
      break;
    }
  }
});
export default TabsContent;
