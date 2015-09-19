window.modules = (function () {
	
	// ----- MODULES FRAMEWORK -----
	var modules = {};
		
	modules.definitions = {};
	
	// Define a new module (with name and optional definition)
	modules.define = function (name, moduleDefinition) {
		var m = new Module(name);
		
		if (moduleDefinition !== undefined) {
			m.export(moduleDefinition);
		}
		
		return m;
	};
		
	// ----- PRIVATE -----
	var waiting = [];
	// Notify the modules system that a module is ready
	function modules_notify() {
		while (waiting.length > 0) {
			var top = waiting[waiting.length - 1];
			var defs = module_resolve(top);
			
			if (defs !== null) {
				var newDef;
				if (typeof top._definition === 'function') {
					newDef = top._definition(defs);
				} else {
					newDef = top._definition;
				}
				
				extend(top, newDef);
				modules.definitions[top.name] = top;
				waiting.pop();
			} else {
				break;
			}
		}
	}
	
	// Resolve dependencies of one module
	function module_resolve(module) {
		var defs = {};
		
		for (var i = 0; i < module._dependencies.length; ++i) {
			var name = module._dependencies[i];
			if (modules.definitions[name] === undefined) return null;
			defs[name] = modules.definitions[name];
		}
		
		return defs;
	}
	
	// Add properties to a base object (shallow)
	function extend(base, ext) {
		for (var prop in ext) {
			if (ext.hasOwnProperty(prop)) {
				base[prop] = ext[prop];
			}
		}
		return base;
	}
	
	// ----- MODULE -----
	function Module(name) {
		this.name = name;
		
		this._valid = false;
		this._definition = null;
		this._dependencies = [];
	}
	
	// Add a dependency to a module
	Module.prototype.import = function (name) {
		this._dependencies.push(name);		
		return this;
	};
	
	// Export the module definition
	Module.prototype.export = function (moduleDefinition) {
		this._definition = moduleDefinition;
		waiting.push(this);
		modules_notify();
		return this;
	};
	
	return modules;
	
}());
