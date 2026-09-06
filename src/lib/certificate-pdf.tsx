import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// Palette mirrors the app's design tokens; react-pdf cannot read CSS variables.
const INK = "#06040E";
const DEEP = "#10242F";
const TANGERINE = "#E29A4D";
const MUTED = "#5B5866";

Font.registerHyphenationCallback((word) => [word]); // never hyphenate names

const s = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", padding: 28 },
  frame: {
    flex: 1,
    borderWidth: 2,
    borderColor: DEEP,
    borderStyle: "solid",
    paddingVertical: 34,
    paddingHorizontal: 46,
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 14, height: 14, backgroundColor: INK },
  brand: { fontSize: 15, fontWeight: 700, color: INK, letterSpacing: -0.4 },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.6,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  body: { alignItems: "center", textAlign: "center" },
  lede: { fontSize: 11, color: MUTED, marginBottom: 8 },
  name: {
    fontSize: 38,
    fontWeight: 700,
    color: INK,
    letterSpacing: -1.2,
    marginBottom: 10,
  },
  rule: { width: 92, height: 3, backgroundColor: TANGERINE, marginBottom: 14 },
  course: { fontSize: 19, fontWeight: 700, color: DEEP, letterSpacing: -0.5 },
  meta: { fontSize: 10, color: MUTED, marginTop: 10 },
  footer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  label: { fontSize: 7.5, letterSpacing: 1.4, color: MUTED, textTransform: "uppercase" },
  value: { fontSize: 10, color: INK, marginTop: 3 },
  serial: { fontSize: 10, color: INK, marginTop: 3, letterSpacing: 0.6 },
  qr: { width: 74, height: 74 },
  verify: { fontSize: 7, color: MUTED, marginTop: 4, textAlign: "center" },
});

export type CertificateProps = {
  learnerName: string;
  courseTitle: string;
  issuedAt: Date;
  serial: string;
  activeMinutes: number;
  qrDataUri: string;
  verifyUrl: string;
};

export function CertificateDocument(props: CertificateProps) {
  const issued = props.issuedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Adhyayan certificate ${props.serial}`}
      author="Adhyayan"
      subject={props.courseTitle}
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.frame}>
          <View style={s.brandRow}>
            <View style={s.mark} />
            <Text style={s.brand}>Adhyayan</Text>
          </View>

          <View style={s.body}>
            <Text style={s.kicker}>Certificate of Completion</Text>
            <Text style={s.lede}>This certifies that</Text>
            <Text style={s.name}>{props.learnerName}</Text>
            <View style={s.rule} />
            <Text style={s.lede}>has successfully completed</Text>
            <Text style={s.course}>{props.courseTitle}</Text>
            <Text style={s.meta}>
              {props.activeMinutes} minutes of measured reading time
            </Text>
          </View>

          <View style={s.footer}>
            <View>
              <Text style={s.label}>Issued</Text>
              <Text style={s.value}>{issued}</Text>
            </View>
            <View>
              <Text style={s.label}>Serial</Text>
              <Text style={s.serial}>{props.serial}</Text>
            </View>
            <View>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image style={s.qr} src={props.qrDataUri} />
              <Text style={s.verify}>Verify at {props.verifyUrl}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
