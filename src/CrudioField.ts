import { ICrudioField, ICrudioFieldOptions } from './CrudioTypes';

export default class CrudioField implements ICrudioField {
	public fieldName: string;
	public caption?: string;
	public fieldType: string;
	public key: boolean;
	public defaultValue?: any;
	public fieldOptions: ICrudioFieldOptions;

	constructor(fieldName: string, fieldType: string, caption?: string, options?: ICrudioFieldOptions) {
		if (!options) {
			options = { canSort: true };
		}

		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.caption = caption;
		this.key = false;
		this.fieldOptions = options;
	}

	GetCaption(): string {
		// if (this.caption) {
		// 	return this.caption;
		// }

		var input: string = this.caption || this.fieldName || '';
		input = input.charAt(0).toUpperCase() + input.slice(1);

		var parts = input.split(/(?=[A-Z])/)

		if (parts) {
			input = '';
			parts.map((t: string) => (input += t.length > 0 ? t + ' ' : ''));

			var result: string = input.toLowerCase().replace(/\-/g, ' ').replace(/\_/g, ' ');

			var val: string = '';
			result.split(' ').map((t: string) => (val += t.charAt(0).toUpperCase() + t.slice(1) + ' '));

			this.caption = val.trim();
		} else {
			this.caption = input;
		}

		return this.caption;
	}
}
