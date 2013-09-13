Ext.define('ReisRadar.view.SourceView',{
	extend: 'Ext.Container',
	requires: 'ReisRadar.util.SVGUtil',
	xtype: 'sourceview',
	config:
	{
		items:[
			{xtype: 'container',
			 itemId: 'sourceItem',
			 items:[
				{
					cls: "source_header",
					html: "&nbsp;"
				},
				{
					cls: "source_status",
					items: 
					[
						{
							cls: "source_icon",
							html: "&nbsp;"
						},
						{
							itemId: 'nameLabel',
							cls: "source_name",
							html: "&nbsp;"
						}
					]
				},
				{
					html: '<hr/>'
				},
				{
					cls: 'source_message_preview_main',
					html: '[PREVIEW_MAIN_PLACEHOLDER]',
					itemId: 'previewMain'
				},
				{
					cls: 'source_message_preview_sub',
					html: '[PREVIEW_SUB_PLACEHOLDER]',
					itemId: 'previewSub'
				},
				{
					cls: 'source_message_count',
					itemId: 'balloon',
					html: '3'
				},
				{
					cls: 'source_circle',
					html: '&nbsp;'
				},
				{
					cls: 'source_arrow',
					html: '&nbsp;'
				},
				{
					cls: 'source_inner_arrow',
					html: '&nbsp;'
				}
				]
			},
			{
				itemId: 'messageCollapser',
				items:
				[
					{
						xtype: 'container',
						itemId: 'messageContainer',
						items: 
						[
						]
					},
					{
						itemId: 'collapseButton',
						cls: 'messageButton',
						html: '>',
						hidden: true
					}
				]
			},
			
						
		]
	},

	collapse: function()
	{
		if(this.messages == undefined)
		{
			return;
		}

		var messageContainer = this.query('#messageContainer')[0];
		if(this.collapsed)
		{
			//show the sources
			//messageContainer.removeAll();

			for(var i = 0; i < this.messages.length; i++)
			{
				var messageView = messageContainer.getAt(i);
				var el = document.getElementById(messageView.id);
				el.style.display = 'none';
			}
			this.collapsed = false;

			var button = this.query('#collapseButton')[0];
			button.setHtml(ReisRadar.util.SVGUtil.arrow_down(0.5));

		}
		else
		{
			for(var i = 0; i < this.messages.length; i++)
			{
				var messageView = messageContainer.getAt(i);
				var el = document.getElementById(messageView.id);
				el.style.display = 'inline';
			}
			this.collapsed = true;

			var button = this.query('#collapseButton')[0];
			button.setHtml(ReisRadar.util.SVGUtil.arrow_up(0.5));

		}
	},
	
	setData: function(data)
	{
		//set type for style
		var item = this.query('#sourceItem')[0];
		item.setCls('source_' + data['name']);
		
		//set type for style
		var citem = this.query('#messageCollapser')[0];
		citem.setCls('messages_' + data['name']);

		var bitem = this.query('#balloon')[0];
		//bitem.setHtml(ReisRadar.util.SVGUtil.balloon(data['count']));
		bitem.setHtml(data['count']);
		
		var pmitem = this.query('#previewMain')[0];
		pmitem.setHtml(data['messages'][0]['body']);
	
		var date = data['messages'][0]['created_at'];
		var destination = data['messages'][0]['geo_relevance'];
		var ts = moment(date,"YYYY-MM-DD HH:mm:ss Z").fromNow();
		var distance = ReisRadar.util.Util.calculateDistance(destination);

		var pmitem = this.query('#previewSub')[0];
		pmitem.setHtml(ts + "&nbsp;" + distance + "m.");
		//TODO: add source if different from source name, like with twitter or cs.
		this.setName(data['title']);
		this.setMessages(data['messages']);

		var messageContainer = this.query('#messageContainer')[0];
		for(var i = 0; i < this.messages.length; i++)
		{
			var message = this.messages[i];
			var messageView = Ext.create('ReisRadar.view.MessageView');
			messageView.setStyle("display: none;");
			messageView.setData(message);
			messageContainer.add(messageView);
		}
	},

	//set the name of this leg
	setName: function(name)
	{
		var aLabel = this.query('#nameLabel')[0];
		aLabel.setHtml(name);	
	},
	
	//set the data for this leg that came back from the server
	setMessages: function(messages)
	{
		if(messages != undefined)
		{
			this.messages = messages;
			if(messages.length > 0)
			{
				var button = this.query('#collapseButton')[0];
				button.setHtml(ReisRadar.util.SVGUtil.arrow_down(0.5));
				button.show();
			}
		}
	},
	
	//print the data for this leg (for debugging)
	printMessages: function()
	{
		//log the data for the leg that we have information for 
		for(var i = 0; i < this.messages.length; i++)
		{
			var message = this.messages[i];
		}
	}
});
