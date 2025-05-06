import React from 'react';

const Footerlandingpage = () => {
  return (
    <footer className="w-full flex justify-center items-end">
      <div
        style={{
          width: 1440,
          height: 365,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderWidth: 1,
          borderStyle: "solid",
          background: `
            linear-gradient(0deg, rgba(248, 248, 248, 0.02), rgba(248, 248, 248, 0.02)),
            radial-gradient(100% 100% at 50% 0%, rgba(255, 255, 255, 0.04) 0%, rgba(248, 248, 248, 0) 54.17%),
            linear-gradient(0deg, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75))
          `,
          borderImage: "linear-gradient(158.39deg, rgba(255,255,255,0.06) 14.19%, rgba(255,255,255,0.000015) 50.59%, rgba(255,255,255,0.000015) 68.79%, rgba(255,255,255,0.015) 105.18%) 1",
          boxShadow: `
            0px 5px 1.5px -4px #05050540,
            0px 6px 4px -4px #0505051A,
            0px 6px 13px 0px #0505051A,
            0px 24px 24px -16px #05050517,
            2px 4px 16px 0px #F8F8F80F inset
          `,
          backdropFilter: "blur(100px)",
          overflow: "hidden",
          margin: "0 auto"
        }}
        className="flex flex-col items-center justify-between p-8"
      >
        {/* TODO: Add your Figma-inspired footer content here */}
      </div>
    </footer>
  );
};

export default Footerlandingpage;
