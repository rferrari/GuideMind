import UrlInputForm from '@/components/UrlInputForm';

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Tutorial Generator</h1>
      <p className="text-gray-600 mb-6">
        Enter a documentation URL to generate tutorial scaffolds
      </p>
      
      <UrlInputForm />
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Example: https://docs.example.com</p>
      </div>
    </main>
  );
}