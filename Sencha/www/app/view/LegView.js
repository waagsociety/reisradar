//self contained view
//because this is a component, we do some event handling ourselves
//also databinding
Ext.define('ReisRadar.view.LegView',{
	extend: 'Ext.Container',
	xtype: 'legview',
	requires:['ReisRadar.util.SVGUtil'],
	config:
	{
		items:[
			{xtype: 'container',
			 layout: 'hbox',
			 cls: 'leg',
			 itemId: 'legContainer',
			 items:[
				{
					itemId: 'nameLabel',
					html: '',
					cls: 'leg_source',
					
					

				},
				{
					itemId: 'modalityIcon',
					cls: 'leg_modality',
				},

				],
			},
			{ xtype: 'container',
				itemId: 'activeRouteContainer',
				cls: 'sources',
				items:[
					{
						xtype: 'container',
						itemId: 'sourceContainer',
						items: 
						[
						]
					},
					{
						xtype: 'container',
						itemId: 'loader',
						height: 48,
						hidden: true,
						items: [
							{
								cls: 'legspinner',
								centered: true,
							}
						],
					},
					{
						xtype:'container',
						itemId: 'warning',
						height: 60,
						hidden: true,
						items:
						[
							{
								xtype: 'button',
								cls: 'titleButton',
								style: 'color: #B8529E; font-size: 1.5em',
								iconCls: 'warning',
								centered: true,
							},
							{
								html: '<br/><br/>Geen verbinding met server,<br/> probeer het later nog eens.',
								centered: true,
								style: 'font-family: Helvetica; '
							}	
						]
					},
					{
						itemId: 'collapseButton',
						cls: 'sourceButton',
						html: '&nbsp;',
						style: 'margin-top: .5em; margin-bottom: 1px; visibility: hidden; height: 10px;',
						listeners: 
						{
							element: 'element',
							tap: function()
							{
								//call collapse on the legview
								this.parent.parent.collapse();
							}
						},
					}
				]
			}
		]
	},

	setHighlighted: function(nameIsHighlighted,routeIsHighlighted)
	{
		var legContainer = this.query('#legContainer')[0];
		var activeRouteContainer = this.query('#activeRouteContainer')[0];

		if(nameIsHighlighted)
		{
			legContainer.setCls('leg_active');
		}
		else
		{
			legContainer.setCls('leg');
		}

		if(routeIsHighlighted)
		{
			activeRouteContainer.setCls('sources_active');
		}
		else
		{
			activeRouteContainer.setCls('sources');
		}
	},

	setLoading: function(isLoading)
	{
		var loadContainer = this.query('#loader')[0];
		var warningContainer = this.query('#warning')[0];
		
		if(isLoading)
		{
			loadContainer.show();
			warningContainer.hide();//disable warning when loading
		}
		else
		{
			loadContainer.hide();
		}
	},

	showWarning: function()
	{
		var warningContainer = this.query('#warning')[0];
		warningContainer.show();//disable warning when loading
	},

	open: function()
	{
		if(this.collapsed || this.sources == undefined){return;}

		var sourceContainer = this.query('#sourceContainer')[0];
		for(var i = 0; i < sourceContainer.items.length; i++)
		{
			var sourceView = sourceContainer.getAt(i);
			var el = document.getElementById(sourceView.id);
			el.style.display = 'inline';
		}
		this.collapsed = true;

		var button = this.query('#collapseButton')[0];
		button.setHtml(ReisRadar.util.SVGUtil.arrow_up(0.75));

	},

	close: function()
	{
		if(this.collapsed == false || this.sources == undefined){return;}
		
		var sourceContainer = this.query('#sourceContainer')[0];
		for(var i = 0; i < sourceContainer.items.length; i++)
		{
			var sourceView = sourceContainer.getAt(i);
			var el = document.getElementById(sourceView.id);
			el.style.display = 'none';
		}		
		this.collapsed = false;

		var button = this.query('#collapseButton')[0];
		button.setHtml(ReisRadar.util.SVGUtil.arrow_down(.75));
	},

	//toggles collapse state
	collapse: function()
	{
		if(this.sources == undefined)
		{
			return;
		}

		if(this.collapsed)
		{
			this.close();
		}
		else
		{
			//closes all other legs
			this.parent.parent.parent.closeLegs();
			this.open();
		}
	},

	//set the name of this leg
	setName: function(name)
	{
		var aLabel = this.query('#nameLabel')[0];
		aLabel.setHtml(name);

	},
	
	//set the modality of this leg
	setModality: function(modality)
	{
		var modalityIcon = this.query('#modalityIcon')[0];
		var html = '&nbsp;';
		switch(modality)
		{
			case ReisRadar.model.Modality.WALK.name:
				html = ReisRadar.util.SVGUtil.icon_walk(.5);
				break;
			case ReisRadar.model.Modality.BIKE.name:
				html = ReisRadar.util.SVGUtil.icon_bike(.5);
				break;
			case ReisRadar.model.Modality.CAR.name:
				html = ReisRadar.util.SVGUtil.icon_car(.5);
				break;
			case ReisRadar.model.Modality.PT.name:
				html = ReisRadar.util.SVGUtil.icon_bus(.5);
				break;
			case ReisRadar.model.Modality.RAIL.name:
				html = ReisRadar.util.SVGUtil.icon_train(.5);
				break;
		}
		modalityIcon.setHtml(html);	
	},
	
	addSource: function(sourceName, source)
	{
		if(this.sources == undefined)
		{
			this.sources = [];
		}

		this.sources.push(source);

		var sourceContainer = this.query('#sourceContainer')[0];
		if(source != undefined && source['count'] > 0) //only show source if there are messages inside
		{
			var sourceView = Ext.create('ReisRadar.view.SourceView');
			sourceView.setData(source);
			sourceContainer.add(sourceView);
		}
	}
});
