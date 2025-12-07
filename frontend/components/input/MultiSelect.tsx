type MultiSelectProps = {
	label: string;
	name: string;
	options: string[];
};

export default function MultiSelect({ label, name, options }: MultiSelectProps) {
	return (
		<fieldset className="border-none p-0 m-0">
			<legend className="block mb-2 font-bold">{label}</legend>
			{options.map(option => {
				const optionId = `${name}-${option}`;
				return (
					<div key={optionId} className="flex items-center mb-2">
						<input type="checkbox" id={optionId} name={name} value={option} className="mr-2" />
						<label htmlFor={optionId}>{option}</label>
					</div>
				);
			})}
		</fieldset>
	);
}
