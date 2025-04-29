
import { ResumeMatchProvider } from "@/context/ResumeMatchContext";
import AppLayout from "@/components/AppLayout";

const Index = () => {
  return (
    <ResumeMatchProvider>
      <AppLayout />
    </ResumeMatchProvider>
  );
};

export default Index;
