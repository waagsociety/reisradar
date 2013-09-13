//enum for modality
//Enum implemented as extjs singleton class
Ext.define('ReisRadar.model.Modality', {
	singleton: true,
	WALK : { value: 0, name: "Lopend", 	cls: "walk" },
	BIKE : { value: 1, name: "Fiets", 	cls: "bike" },
	CAR  : { value: 2, name: "Auto", 	cls: "car" },
	PT   : { value: 3, name: "OV", 		cls: "bus" },
	RAIL : { value: 4, name: "Trein", 	cls: "train" }
}
);
