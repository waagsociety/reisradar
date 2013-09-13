//view responsible for replying to intelligence
Ext.define('ReisRadar.view.ReplyComposer',
{
	extend: 'Ext.form.Panel',
	xtype: 'replycomposer',
	config:
	{
		layout:'vbox',
		items:
		[
			{
				xtype: 'titlebar',
				docked: 'top',
				title: '',
				items: [{
					xtype: 'button',
					cls: 'titleButton',
					iconCls: 'back',
					ui: 'up',
					text: ReisRadar.util.Messages.BACK,
					action: 'done'
				}]
			},
			{
				xtype: 'container',
				layout: 'hbox',
				margin: 10,
				items: [
					{
						xtype: 'textfield',
						name: 'alias',
						itemId: 'aliasField',
						placeHolder: ReisRadar.util.Messages.ALIAS_PLACEHOLDER,
						width: '200px',
						height: '40px'
					},
					{
						xtype: 'button',
						text: ReisRadar.util.Messages.REGISTER,
						action: 'comment_register',
						itemId: 'registerButton',
						cls: 'defaultButton'
					}]
			},
			{
				xtype: 'textareafield',
				name: 'body',
				placeHolder: ReisRadar.util.Messages.COMMENT_PLACEHOLDER,
				maxRows: 8,	
				margin: 10,
			},
			{
				html: "<hr style='width: 90%'>"
			},
			{
				xtype: 'container',
				itemId: 'messageTemplate',
				html: '',
				style: 'color: #FFFFFF; background-color: #66CCCC; padding: 10;',
				margin: 10
			},
			{
				xtype: 'tabbar',
				docked: 'bottom',
				items: [
				{
					xtype:'container',
					layout: 'hbox',
					items:[
					{
						xtype: 'button',
						text: ReisRadar.util.Messages.SEND,
						iconCls: 'check',
						action: 'send_reply',
						cls: 'titleButton',
						itemId: 'sendButton'
					},
					]
				}
				]
			}

		]
	}
});
