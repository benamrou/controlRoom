var apiconnWsdl = require("apiconnect-wsdl");
var yaml 	    = require("js-yaml");
var fs          = require("fs");

var promise = apiconnWsdl.getJsonForWSDL("https://sec.gold-tomandco.com/gso/webservices/GWSCommon/GWSCommonGetArticleSalesPrices");

promise.then(function(wsdls){
	
	// Get Services from all parsed WSDLs
	var serviceData = apiconnWsdl.getWSDLServices(wsdls);

	// Loop through all services and genereate yaml file
	for (var  item in serviceData.services) {
		var serviceName = serviceData.services[item].service;
		var wsdlId = serviceData.services[item].filename;
		var wsdlEntry = apiconnWsdl.findWSDLForServiceName(wsdls, serviceName);
		var swagger = apiconnWsdl.getSwaggerForService(wsdlEntry, serviceName, wsdlId);
		fs.writeFile(serviceName+".yaml", yaml.safeDump(swagger))
	}
}, function (error) {
	console.log(error.message)
});
