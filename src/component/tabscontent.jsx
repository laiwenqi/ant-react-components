import React from 'react';
/*import所有用到的页面*/
 import Employee from '../web/employee.jsx';
 import Device from '../web/device.jsx';
 import DevType from '../web/devtype.jsx';
 import BusinessAndPayer from '../web/businessandpayer.jsx';
 import DeviceConfig from '../web/deviceconfig.jsx';
 import DevModel from '../web/devmodel.jsx';
 import DevFittings from '../web/devfittings.jsx';
 import DevLog from '../web/devlog.jsx';
 import OperatorLog from '../web/operatorlog.jsx';
 import Container from '../web/container.jsx';
 import Devmonitor from '../web/devmonitor.jsx';
 import Role from '../web/role.jsx';
 import Organization from '../web/organization.jsx';
 import Abnormal from '../web/abnormal.jsx';
 import Payment from '../web/payment.jsx';
 import Cycle from '../web/cycle.jsx';
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
      case "devmonitor":
        return (<Devmonitor/>)
      break;
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
      case "container_ka":
        return (<Container id={2} />)
      break;
      case "container_chao":
        return (<Container id={1} />)
      break;
      case "role":
        return (<Role />)
      break;
      case "organization":
        return (<Organization />)
      break;
      case "abnormal":
        return (<Abnormal />)
      break;
      case "payment":
        return (<Payment />)
      break;
      case "cycle":
        return (<Cycle />)
      break;
    }
  }
});
export default TabsContent;
