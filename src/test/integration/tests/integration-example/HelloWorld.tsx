export const HelloWorld = ({ name }: { readonly name: string }) => {
  return (
    <div>
      <h1>
        {`Hello ${name}!`}
      </h1>
    </div>
  );
};
