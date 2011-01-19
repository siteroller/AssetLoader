/*
---
description: Lazy Loader for CSS, image and JavaScript files. Backwards compat with the Moore-Asset Class.
copyright: Sam Goody, December 2010.
license: OSL v3.0 (http://www.opensource.org/licenses/osl-3.0.php)
authors: Sam Goody <siteroller - |at| - gmail>

requires:
- core

provides: [ AssetLoader.javascript
		  , AssetLoader.css
		  , AssetLoader.images
		  , AssetLoader.mixed  
		  , AssetLoader.path
		  ]
        
credits: Syntax and IE script.load hack based on the More-Assets Class, which this is meant to replace.
...
*/

var AssetLoader  = 
	{ options: 
		{ script:  { chain: true }
		, defaults:{ chain: false
                   , onInit: function(){}
                   , onComplete: function(){}
                   , onProgress: function(){}
                   , path: ''
                   }
                   , path:    ''
		}
	, properties:
		{ script:{ type: 'text/javascript' }
		, link:  { rel: 'stylesheet'
                 , media: 'screen'
                 , type: 'text/css'
                 }
		, img:   {}
		}
	, load: function(files, options, type, obj, index){
        AssetLoader.build();
        if (!files.length) return alert('err: No Files Passed'); //false;
		
        var file = files.shift()
          , chain = file.chain  
          , path = ([file.path, options.path, AssetLoader.path].pick() || '') + [file.src, file.href, file].pick();
		
        if (type == 'mixed') type = AssetLoader.type(file);
        var opts = Object.merge({events:{}}, AssetLoader.options.defaults, AssetLoader.options[type] || {}, options);
        file = Object.merge(file.big ? {} : file, opts);
        file[type == 'link' ? 'href' : 'src'] = path;
        
        var events = ['load','error','abort'];
        events.each(function(event){
           [event, 'on'+event, 'on'+event.capitalize()].some(function(item,i){
              var where = i ? file.events : file;
              if (!where[item]) return false; // ToDo: Delete this line!         
              opts[event] = where[item];
              delete where[item];
           });
        });
        if (!opts.load) opts.load = file.onProgress;
        Object.each(AssetLoader.options.defaults, function(v,k){ delete file[k] });

        var exists, i = ++index[1];
        if (exists = AssetLoader.loaded[type][path]){
           opts.load.call(exists, ++index[0], i, path);
           files.length
              ? AssetLoader.load(files, options, type, obj, index)
              : opts.onComplete();
           obj[type].push(exists);
           return obj;
        };
        if (exists = AssetLoader.loading[path]){
           Object.map(exists, function(methods, event){ return methods.push(opts[event]) });
           if (!files.length) exists.load.push(opts.onComplete);
           return obj;
        };
        AssetLoader.loading[path] = {load:[],abort:[],error:[]};

        var asset = new Element(type);
        function callEvent(event){
           asset.removeEvent('load');
           opts[event].call(asset, ++index[0], i, path);
           AssetLoader.loading[path][event].each(function(func){func.call(asset, index[0], i, path)});
           delete AssetLoader.loading[path];
           AssetLoader.loaded[type][path] = this;
           
           if (files.length)
              AssetLoader.load(files, options, type, obj, index);
           else {
              opts.onInit();
              opts.onComplete();
           }
        };
        events.each(function(event){
           if (opts[event]) asset.addEvent(event, callEvent.pass(event));
        });
        if (type == 'script' && Browser.ie && !Browser.ie9) asset.addEvent('readystatechange', function(){
           if ('loaded,complete'.contains(this.readyState)) callEvent('load');
        });
        asset.set(Object.merge(AssetLoader.properties[type], file));
        
        if (type != 'img') asset.inject(document.head);
        else if (Browser.ie && asset.complete) callEvent('load');
        if (!chain && files.length) AssetLoader.load(files, options, type, obj, index);
        return obj;
	  }
	, loaded: {}
	, loading: {}
	, build: function(){
        Object.each({script:'src',link:'href',img:'src'},function(path,tag){
           AssetLoader.loaded[tag] = {};
           $$(tag+'['+path+']').each(function(el){AssetLoader.loaded[tag][el.get(path)] = el});
        });
        return function(){};
     }
	, type: function(file){
        var file = file.src || file;
        if (file.href || /css$/i.test(file)) return 'link';
        if (/js$/i.test(file)) return 'script';
        if (/(jpg|jpeg|bmp|gif|png)$/i.test(file)) return 'img';
        return 'fail';
	  }
	, wait:function(){
          me.setStyles({'background-image':curImg, 'background-position':curPos}); 
	  }
	};

Object.each({javascript:'script', css:'link', image:'img', images:'img', mixed:'mixed'}, function(val, key){
	AssetLoader[key] = function(files, options){
      AssetLoader.load(Array.from(files), options, val, {img:[],link:[],script:[],fail:[]}, [-1,-1]);
	};
});
window.addEvent('domready', function(){ AssetLoader.build = AssetLoader.build()});
var Asset = AssetLoader;