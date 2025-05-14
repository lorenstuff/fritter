//
// Class
//

export type FritterFileOptions =
{
	path: string;
	fileName: string;
	size: number;
	mimeType: string;
	modifiedDate: Date;
};

export class FritterFile
{
	path: string;
	size: number;
	fileName: string;
	mimeType: string;
	modifiedDate: Date;

	constructor(options: FritterFileOptions)
	{
		this.path = options.path;
		this.size = options.size;
		this.fileName = options.fileName;
		this.mimeType = options.mimeType;
		this.modifiedDate = options.modifiedDate;
	}
}