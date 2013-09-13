Ext.define('ReisRadar.util.Messages', 
{
	singleton: true,

	//routeselectionview
	ROUTE_TITLE : 'Mijn Routes',
	ROUTE_NEW : 'Nieuwe Route',

	//intelligence view
	INTELLIGENCE_NEW : 'Nieuw Bericht',
	INTELLIGENCE_REFRESH : 'Verversen',

	//routedefinitionview
	BACK : 'Terug',
	TRASH : 'Verwijderen',
	NAME_LABEL : 'Naam: ',
	NAME_PLACEHOLDER : 'Geef een naam aan deze route',
	ORIGIN_LABEL : 'Vertrek: ',
	ORIGIN_PLACEHOLDER : 'Voer een vertreklocatie in',
	DESTINATION_ADD : 'Bestemming toevoegen',
	CONFIRM : 'Akkoord',

	//route definitioncontroller
	CONFIRM_TRASH : 'Weet je het zeker?',
	PROCESSING_LOCATION: 'Huidige locatie verwerken..',
	PROCESSING_DESTINATION: 'Bestemming verwerken..',
	DESTINATION_ERROR: 'Onbekende bestemming!',
	NOTIFICATION : 'Notificatie',
	ERROR_LOCATION : 'Onbekende bestemming!',
	MAX_DEST_REACHED : 'Maximum aantal tussenstappen bereikt!',
	ERROR_NAME : 'Geef een naam aan deze route',
	ERROR_DESTINATION_EMPTY : 'Voer een bestemming in.',

	//leg definitioncontroller
	ERROR_LEG : 'Geen reisinformatie gevonden.',
	ERROR_LEG_MESSAGE : 'Er is helaas geen reisinformatie gevonden voor dit traject.\n Probeer eventueel een exacte halte/station in te voeren. \nMogelijk is er geen directe verbinding, voeg dan een tussenstop toe.',

	//legdefinitionview
	DESTINATION_LABEL : 'Bestemming: ',
	DESTINATION_PLACEHOLDER : 'Voer een bestemming in.',
	TMODE_LABEL : 'met: ',
	DESTINATION_DONE : 'Toevoegen',

	//intelligencecomposer
	ALIAS_PLACEHOLDER : 'Alias',
	REGISTER : 'Registreer',
	MESSAGE_PLACEHOLDER : 'Schrijf hier een bericht over deze route',
	SEND : 'Verzend',

	//replycomposer
	COMMENT_PLACEHOLDER : 'Schrijf hier een reactie',

	//replycontroller
	//composercontroller
	COMMENT_ERROR: 'Plaatsen bericht mislukt',
	PROCESSING_COMMENT : 'Bericht plaatsen..',
	ALIAS_TAKEN: 'Kies een andere gebruikersnaam, deze is bezet.',
	ALIAS_ERROR: 'Registeren mislukt.',
	PROCESSING_REGISTRATION: 'Registreren..'

}
);
