import ProductDesktop from './ProductDesktop';
import ProductMobile from './ProductMobile';

export default function ProductPage() {
  return (
    <>
      <div className="hidden md:block">
        <ProductDesktop />
      </div>
      <div className="md:hidden">
        <ProductMobile />
      </div>
    </>
  );
}