// import Link from "next/link";
import { NoDataFound } from "@/components/no-data-found";
// export default function NotFound() {
//   return (
//     <main className="min-h-screen flex items-center justify-center bg-background">
//       <div className="container mx-auto px-4 text-center">
//         <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
//         <p className="text-muted-foreground mb-8">
//           The page you are looking for does not exist or has been moved.
//         </p>
//         <Link
//           href="/"
//           className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
//         >
//           Return Home
//         </Link>
//       </div>
//     </main>
//   );
// }

export default function NotFound() {
  return <NoDataFound />;
}
