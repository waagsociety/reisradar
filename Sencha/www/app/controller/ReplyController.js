//responsible for handling actions of the ReplyView
Ext.define('ReisRadar.controller.ReplyController',
{
	extend: 'Ext.app.Controller',
	requires: ['Ext.MessageBox', 'ReisRadar.util.Config', 'ReisRadar.util.Util'],
	config:
	{
		views:
		[
			'ReisRadar.view.ReplyComposer'
		],
		
		refs:
		{
			main: 'main',
			aliasField: '#aliasField',
			replyForm: 'replycomposer',
			replyTemplate: 'replycomposer #messageTemplate',
			registerButton: '#registerButton',
			sendButton: '#sendButton',
		},

		control: 
		{
			replycomposer:
			{
				activate: 'onReply'
			},

			'button[action=send_reply]':
			{
				tap: 'onSendReply'
			},

			'button[action=comment_register]':
			{
				tap: 'onRegister'
			},

		}
	},

	onReply: function()
	{
		
		if(ReisRadar.util.LocalStorage.getAlias() != undefined)
		{
		   this.getAliasField().setValue(ReisRadar.util.LocalStorage.getAlias());
		   this.getAliasField().setDisabled(true);
		   this.getRegisterButton().setHidden(true);
		}
		else
		{
			this.getSendButton().setDisabled(true);
		}

		var placeholder = this.getReplyTemplate();
		var html = ReisRadar.app.currentReplyData['body'];
		placeholder.setHtml(html);
	},

	
	//send a reply
	onSendReply: function()
	{
		
		var values = this.getReplyForm().getValues();
		var body = values['body'];
		var token = ReisRadar.util.LocalStorage.getPassword();
		var alias = ReisRadar.util.LocalStorage.getAlias();
		this.currentAlias = alias;
		
		var data = ReisRadar.app.currentReplyData;

		//ajax send request
		var cdk_node = data['cdk_id']; //for crowd sourced data, cdk_id means the route.
		if(data['source_type'] != "rr") //for open data, cdk_id means something different, and is specified in the 'id' field instead.
		{
			cdk_node = data['id'];	
		}
		
		var url = ReisRadar.util.Config.config.baseUrl + '/comment'	
		
		var config = {
			url: url,
			method: 'POST',
			withCredentials: false,
			useDefaultXhrHeader: false,
			scope:this,
			params:
			{
				message: body,
				source: alias,
				token: token,
				cdk_node: cdk_node,
				source_type: data['source_type'],
				intelligence_id: data['id']
			},
			callback: function(options,success,response)
			{
				this.getMain().setMasked(false);
				if(success)
				{
					this.onComposeDone();
				}
				else
				{
					ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.COMMENT_ERROR);
				}
			}
		};

		this.getMain().setMasked({xtype:'loadmask',message: ReisRadar.util.Messages.PROCESSING_COMMENT});	
		Ext.Ajax.request(config);

	},
	
	onComposeDone: function()
	{
		var navigation = this.getMain();
		navigation.animateActiveItem(0,{type:'slide',direction:'down'});
	},

	onRegister: function()
	{
		var alias = this.getAliasField().getValue();
		if(alias != undefined && alias.length > 0)
		{
			//create a password from alias and some random stuff
			var password = this.createPassword(alias);

			//register the alias with the given password
			var url = ReisRadar.util.Config.config.baseUrl + '/member/register'	
			var config = {
				url: url,
				method: 'POST',
				withCredentials: false,
				useDefaultXhrHeader: false,
				scope:this,
				params:
				{
					username: alias,
					password: password,
				},
				callback: function(options,success,response)
				{
					this.getMain().setMasked(false);
					if(success)
					{
						var available = response.responseText;
						if(available == 'false')
						{
							ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION, ReisRadar.util.Messages.ALIAS_TAKEN);	
						}
						else
						{
							//save alias and password
							ReisRadar.util.LocalStorage.setAlias(alias);
							ReisRadar.util.LocalStorage.setPassword(password);
							this.getAliasField().setDisabled(true);
		   					this.getRegisterButton().setHidden(true);
							this.getSendButton().setDisabled(false);
						}
					}
					else
					{
						ReisRadar.util.Util.showAlert(ReisRadar.util.Messages.NOTIFICATION,ReisRadar.util.Messages.ALIAS_ERROR);
					}
				}
			};
			this.getMain().setMasked({xtype:'loadmask',message: ReisRadar.util.Messages.PROCESSING_REGISTRATION});	
			Ext.Ajax.request(config);
		}
	},

	//generates password from device id hashed with username,
	//if no device exists, generates a random password
	createPassword: function(alias)
	{
		var deviceId = Ext.device.Device.uuid;
		if(deviceId == 'anonymous')
		{
			//generate something else that is random
			deviceId = Math.random().toString(36).substring(7); 
		}

		var hash = md5(deviceId + alias);
		return hash;
	}
});
