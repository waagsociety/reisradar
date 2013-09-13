//view responsible for creating new intelligence
//
Ext.define('ReisRadar.view.IntelligenceComposer',
{
	extend: 'Ext.form.Panel',
	xtype: 'intelligencecomposer',
	
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
					text: ReisRadar.util.Messages.BACK,
					iconCls: 'back',
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
						action: 'register',
						itemId: 'registerButton',
						cls: 'defaultButton'
					}]
			},
			{
				xtype: 'textareafield',
				name: 'body',
				placeHolder: ReisRadar.util.Messages.MESSAGE_PLACEHOLDER,
				maxRows: 8,	
				margin: 10,
			},
			{
				id: 'lmap',//leaflet map
				height: 200, //predefined height
				margin: 10,
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
						action: 'send',
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
