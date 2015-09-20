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
		for (var i = waiting.length - 1; i >= 0; --i) {
			var next = waiting[i];
			var defs = module_resolve(next);
			
			if (defs === null) {
				continue;
			}
				
			console.log("Loading module: "+next.name+" ("+next._dependencies+")");
			
			var newDef;
			if (typeof next._definition === 'function') {
				newDef = next._definition(defs);
			} else {
				newDef = next._definition;
			}
			
			extend(next, newDef);
			modules.definitions[next.name] = next;
			waiting.splice(i,1);
			
			return modules_notify();
		}
	}
	
	// Resolve dependencies of one module
	function module_resolve(module) {
		var defs = {};
		
		for (var i = 0; i < module._dependencies.length; ++i) {
			var name = module._dependencies[i];
			if (modules.definitions[name] !== undefined) {
				defs[name] = modules.definitions[name];
			} else {
				defs[name] = module_in_queue(name);
				if (defs[name] === undefined) return null;
			}
		}
		
		return defs;
	}
	
	function module_in_queue(name) {
		for (var w = 0; w < waiting.length; ++w) {
			if (waiting[w].name === name) { return waiting[w]; }
		}
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
