import { ICrudioForLoop, ICrudioRange, ICrudioStream } from "./CrudioTypes";

export class CrudioStream {
	name: string;
	parentEntity: string;
	key: string;
	value: any;
	createEntity: string;
	for: CrudioForLoop;

	constructor(private context: Record<string, unknown>, definition: ICrudioStream) {
		this.name = definition.name;
		this.parentEntity = definition.parentEntity;
		this.createEntity = definition.createEntity;

		if (this.parentEntity === undefined) {
			throw `CrudioStream: stream '${this.name} - missing 'parentEntity' attribute`;
		}

		if (this.createEntity === undefined) {
			throw `CrudioStream: stream '${this.name} - missing 'createEntity' attribute`;
		}

		if (this.createEntity === undefined) {
			throw `CrudioStream: stream '${this.name} - missing 'createEntity' attribute`;
		}

		this.key = definition.key;
		this.value = definition.value;

		if (this.key === undefined && this.value !== undefined) {
			throw `CrudioStream: stream '${this.name} - 'value' is specified, but 'key' has not been specified. To filter the parent entity, both attributes must be specified`;
		}

		if (this.value === undefined && this.key !== undefined) {
			throw `CrudioStream: stream '${this.name} - 'key' is specified, but 'value' has not been specified. To filter the parent entity, both attributes must be specified`;
		}

		if (definition.for) {
			this.for = new CrudioForLoop(definition.for);
		} else {
			throw `CrudioStream: stream '${this.name} - missing 'for' specification`;
		}
	}

	Execute(cb: (output_entity: any) => void): void {
		this.for.Execute(this.context, output_entity => {
			cb(output_entity);
		});
	}
}

export class CrudioForLoop {
	for: CrudioForLoop;
	index = 0;
	current_value: string | number | Date;
	complete = false;
	output: any | undefined;
	range: ICrudioRange;

	constructor(definition: ICrudioForLoop) {
		if (definition.for) {
			this.for = new CrudioForLoop(definition.for);
		}

		this.output = definition.output;
		this.range = definition.range;
	}

	get CurrentValue(): string | number | Date {
		return this.current_value;
	}

	Increment(): void {
		if (this.range.list) {
			this.index++;
			if (this.index >= this.range.list.length) {
				this.complete = true;
			} else {
				this.current_value = this.range.list[this.index] as any;
			}
		} else {
			switch (typeof this.current_value) {
				case "number":
					this.current_value += this.range.increment;

					if (this.range.increment > 0 && this.current_value > this.range.max) {
						this.complete = true;
					} else if (this.range.increment < 0 && this.current_value < this.range.min) {
						this.complete = true;
					}
					break;

				default:
					//"Date"

					let date = (this.current_value as Date).valueOf();
					date += this.range.increment;
					this.current_value = date;

					if (this.range.increment > 0 && date > (this.range.max as Date).valueOf()) {
						this.complete = true;
					} else if (this.range.increment < 0 && date < (this.range.min as Date).valueOf()) {
						this.complete = true;
					}
					break;
			}
		}
	}

	Execute(context: any, cb: (output_entity: any) => void): void {
		this.complete = false;
		this.index = 0;

		if (this.range.list) {
			this.current_value = this.range.list[this.index] as any;
		} else {
			if (this.range.increment > 0) {
				this.current_value = this.range.min;
			} else {
				this.current_value = this.range.max;
			}
		}

		while (!this.complete) {
			this.UpdateContext(context);

			if (this.output) {
				cb(this.output);
			}

			if (this.for) {
				this.for.Execute(context, cb);
			}

			this.Increment();
		}
	}

	UpdateContext(context: any): void {
		context[this.range.name] = { name: this.range.name, values: this.current_value };
	}
}
