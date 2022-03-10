import { ViewProps } from '../../../src';

export default function IndexView(props: ViewProps) {
	return (
		<div>data={JSON.stringify(props.data)} errors={JSON.stringify(props.data.model.errors.messages())}</div>
	)
}