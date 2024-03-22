const OFFSET = -45150;

export function convertCode(code: string){
	try{
		code = decodeURIComponent(code);
	}
	catch{
		return null;
	}

	if(code.includes('FDP24'))
		return code;

	if(code.includes('XNRF')){
		code = code.replace('XNRF', '');
		code = code.replace('/24', '');
		code = code.trim(); 

		let num = parseInt(code);
		num += OFFSET;
		
		let str = num.toString();
		while(str.length < 4){
			str = '0' + str;
		}
		return `FDP24-${str}`;
	}
	
    return null;
}