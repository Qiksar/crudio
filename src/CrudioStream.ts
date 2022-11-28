import { ICrudioForLoop, ICrudioRange, ICrudioStream } from "./CrudioTypes";

export class CrudioStream {
	name: string;
	entity: string;
	createEntity: string;
	for: CrudioForLoop;

	constructor(private context: Record<string, unknown>, definition: ICrudioStream) {
		this.name = definition.name;
		this.entity = definition.entity;
		this.createEntity = definition.createEntity;

		if (definition.for) {
			this.for = new CrudioForLoop(definition.for);
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
