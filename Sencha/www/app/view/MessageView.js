Ext.define('ReisRadar.view.MessageView',{
	extend: 'Ext.Container',
	requires: ['ReisRadar.util.Util','ReisRadar.util.SVGUtil'],
	xtype: 'messageview',
	config:
	{
		items:[
			{
				xtype: 'container',
				itemId: 'messageItem',
				items:[
					{
						cls: 'message',
						items:[
							{
								cls: 'message_title',
								itemId: 'titleLabel'
							},
							{
								cls: 'message_body',
								itemId: 'bodyLabel',
								html: '&nbsp;&nbsp; a message view',
							},
							{
								cls: 'message_add_comment',
								itemId: 'addCommentButton',
								html: '+'/*
								listeners:
								{
									element: 'element',
									tap: function()
									{
										this.parent.parent.parent.addComment();
									}
								}*/
							}
						]
					},
					{
						html:'<hr/>',
					},
					{
						itemId: 'commentsCollapser',
						cls: 'comments',
						items:
						[
							{
								xtype: 'container',
								itemId: 'actualCommentsContainer',
								items:
								[
									
								]
							},
							{
								xtype: 'container',
								itemId: 'commentsContainer',
								items: 
								[
								]
							},
							{
								itemId: 'collapseButton',
								cls: 'commentButton',
								html: '>',/*
								listeners: 
								{
									element: 'element',
									tap: function()
									{
										//call collapse on the legview
										this.parent.parent.parent.collapse();
									}
								},*/
								hidden: true
							},
							{
								cls: 'commentCount',
								itemId: 'commentCount',
								html: ''
							}
						]
					},
			
				]
			}
		]
	},

	addComment: function()
	{
		//fire event, handled in controller
		this.fireEvent('comment', this, this.data);
	},

	collapse: function()
	{
		if(this.comments == undefined)
		{
			return;
		}

		var commentsContainer = this.query('#commentsContainer')[0];
		
		if(this.collapsed)
		{
			commentsContainer.removeAll();
			this.collapsed = false;
			var item = this.query('#collapseButton')[0];
			item.setHtml(ReisRadar.util.SVGUtil.arrow_down(0.25));
		}
		else
		{
			var item = this.query('#collapseButton')[0];
			item.setHtml(ReisRadar.util.SVGUtil.arrow_up(0.25));

			for(var i = 0; i < this.comments.length; i++)
			{
				var comment = this.comments[i];
				var commentView = Ext.create('ReisRadar.view.CommentView');
				commentView.setData(comment);
				commentsContainer.add(commentView);
			}
			this.collapsed = true;
		}
	},

	setStatus: function(data)
	{

		var date = data['created_at'];
		var ts = moment(date,"YYYY-MM-DD HH:mm:ss Z").fromNow();
		var distance = ReisRadar.util.Util.calculateDistance(data['geo_relevance']);
		
		var item = this.query('#titleLabel')[0];
		
		//set status string
		var html = data['source_name'] + 
			"&nbsp;&nbsp;<span class='message_status_time'>&nbsp;"+ ts + "</span>" 
			+ "<span class='message_status_loc'>&nbsp;" +  distance + "m. </span>"; 
		
		item.setHtml(html);
	},

	//process the comments into two segments
	processComments: function(item, comments)
	{
		//split comments into two groups
		var history = [];
		var actual = [];

		for(var index in comments)
		{
			var comment = comments[index];
			var now = moment();
			var ts = moment(comment['created_at'],"YYYY-MM-DD HH:mm:ss Z");
			var duration = now.diff(ts, 'days');
			if(duration == 0)
			{
				actual.push(comment);
			}
			else
			{
				history.push(comment);
			}
		}
				
		//set comments indicator	
		if(history != undefined && history.length > 0)
		{	
			item.setHtml('+' + history.length);
		}
		else if(actual.length > 0)
		{
			//
		}
		else
		{
			item.setHtml('&nbsp;');
			var item = this.query('#commentsCollapser')[0];
			item.setStyle('background-color: transparent;'); //hack

		}
		
		this.setComments(history,actual);
	},

	//set the data for this message that came back from the server
	setComments: function(history,actual)
	{
		//show the actual comments in the actual container
		var actualCommentsContainer = this.query('#actualCommentsContainer')[0];
		for(var i = 0; i < actual.length; i++)
		{
			var comment = actual[i];
			var commentView = Ext.create('ReisRadar.view.CommentView');
			commentView.setData(comment);
			actualCommentsContainer.add(commentView);
		}

		//save the history comments as instance variable, to be shown when collapsed
		if(history != undefined)
		{
			this.comments = history;
			if(history.length > 0)
			{
				var button = this.query('#collapseButton')[0];
				button.show();
			}
		}
	},

	//update html with data
	//including body and comments
	setData: function(data)
	{
		this.data = data;
		
		//set type
		var item = this.query('#messageItem')[0];
		item.setCls('message_' + data['source_type']);

		var item = this.query('#collapseButton')[0];
		item.setHtml(ReisRadar.util.SVGUtil.arrow_down(0.25));
		
		var item = this.query('#commentCount')[0];
			
		//process the comments into two segments, actual and history	
		this.processComments(item, data['comments']);	
		
		//set comment balloon	
		var item = this.query('#addCommentButton')[0];
		item.setHtml(ReisRadar.util.SVGUtil.balloon('+'));
		
		//set status
		this.setStatus(data);
		
		//set body
		this.setBody(data['body']);
		
		
	},
	
	//set the body of this message 
	setBody: function(body)
	{
		var aLabel = this.query('#bodyLabel')[0];
		aLabel.setHtml(body);	
	},
	

	
	//print the data for this leg
	printComments: function()
	{
		//log the data for the leg that we have information for 
		for(var i = 0; i < this.comments.length; i++)
		{
			var comment = this.comments[i];
		}
	}
});
