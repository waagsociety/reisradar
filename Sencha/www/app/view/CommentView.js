//Represents a comment
Ext.define('ReisRadar.view.CommentView',{
	extend: 'Ext.Container',
	xtype: 'commentview',
	config:
	{
		items:[
			{
				cls: 'comment',
				items: 
				[
					{
						itemId: 'titleLabel',
						html: '&nbsp;',
						cls: 'comment_title'
						
					},
					{
						itemId: 'bodyLabel',
						html: '&nbsp;',
						cls: 'comment_body'
					},
					{
						html: '<hr>'
					}

				]
			}
		]
	},

	setData: function(data)
	{
		
		var date = data['created_at'];
		var ts = moment(date,"YYYY-MM-DD HH:mm:ss Z").fromNow();

		var item = this.query('#titleLabel')[0];
		
		//set status string
		var html = data['source_name'] + 
			"&nbsp;&nbsp;<span class='comment_status_time'>&nbsp;"+ ts + "</span>"; 
		
		item.setHtml(html);
		this.setBody(data['body']);	
	},

	//set the body of this message 
	setBody: function(body)
	{
		var aLabel = this.query('#bodyLabel')[0];
		aLabel.setHtml(body);	
	}
});

