import cn from 'classnames';

type InputLabelProps = {
  label: string;
  caseType: 'uppercase' | 'normal-case';
};

export default function InputLabel({ label, caseType }: InputLabelProps) {
  return (
    <label
      className={cn(
        'block leading-6 font-medium text-white text-[17px]',
        caseType === 'uppercase' ? 'uppercase' : 'normal-case'
      )}
    >
      {label}
    </label>
  );
}
