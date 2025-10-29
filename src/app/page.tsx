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

      {/* Footer with attribution */}
      <footer className="mt-16 pt-8 border-t border-gray-800 text-center">
        <div className="text-gray-500 text-sm">
          <p className="mb-2">
            Built for the{' '}
            <a
              href="https://ns.com/earn/tutorial-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Tutorial Generator Competition
            </a>{' '}
            on <a
              href="https://ns.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >ns.com</a>
          </p>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            This project was created as an entry for an Earn competition.
            Follow the link to learn more and submit your own projects!
          </p>
        </div>
      </footer>

    </main>
  );
}