import UrlInputForm from '@/components/UrlInputForm';

export default function Home() {
  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          GuideMind
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          AI that understands docs and teaches them back.
        </p>
        <br />
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Transform documentation into ready to create tutorial with AI.
          Generate outlines, estimate Task Payouts rewards, and kickstart your content creation.
        </p>
      </div>

      <UrlInputForm />

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Try it with documentation sites like:</p>
        <div className="flex justify-center gap-4 mt-2 flex-wrap">
          <span className="bg-gray-800 px-3 py-1 rounded-md">https://render.com/docs</span>
          <span className="bg-gray-800 px-3 py-1 rounded-md">https://supabase.com/docs</span>
          <span className="bg-gray-800 px-3 py-1 rounded-md">https://console.groq.com/docs/overview</span>
        </div>
      </div>
    </main>
  );
}