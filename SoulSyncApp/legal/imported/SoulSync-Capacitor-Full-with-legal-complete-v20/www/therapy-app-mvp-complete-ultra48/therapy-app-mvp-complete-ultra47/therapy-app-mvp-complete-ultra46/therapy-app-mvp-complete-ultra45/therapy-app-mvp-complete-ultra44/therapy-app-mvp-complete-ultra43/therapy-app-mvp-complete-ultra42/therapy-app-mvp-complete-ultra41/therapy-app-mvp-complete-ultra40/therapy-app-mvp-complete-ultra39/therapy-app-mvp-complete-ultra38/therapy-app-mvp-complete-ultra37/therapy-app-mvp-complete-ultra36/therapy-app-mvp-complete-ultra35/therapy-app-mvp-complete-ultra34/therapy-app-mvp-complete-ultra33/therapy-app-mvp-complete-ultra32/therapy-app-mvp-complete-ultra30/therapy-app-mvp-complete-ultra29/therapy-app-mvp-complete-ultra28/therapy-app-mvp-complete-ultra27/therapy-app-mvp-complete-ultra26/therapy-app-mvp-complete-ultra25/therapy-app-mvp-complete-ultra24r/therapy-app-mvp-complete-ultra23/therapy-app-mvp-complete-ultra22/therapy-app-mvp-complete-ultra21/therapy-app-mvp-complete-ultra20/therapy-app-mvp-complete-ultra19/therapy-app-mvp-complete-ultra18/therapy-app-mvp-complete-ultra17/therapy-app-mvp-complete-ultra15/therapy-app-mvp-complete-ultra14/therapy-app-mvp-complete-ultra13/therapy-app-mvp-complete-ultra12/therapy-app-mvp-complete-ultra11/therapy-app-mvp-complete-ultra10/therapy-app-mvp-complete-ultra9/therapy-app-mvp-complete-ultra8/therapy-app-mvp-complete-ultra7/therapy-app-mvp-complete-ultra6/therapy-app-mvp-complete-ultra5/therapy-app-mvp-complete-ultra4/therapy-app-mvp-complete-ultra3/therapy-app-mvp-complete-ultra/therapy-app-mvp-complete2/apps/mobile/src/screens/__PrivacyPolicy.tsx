
import React from 'react'; import { ScrollView, Text } from 'react-native';
export default function PrivacyPolicy(){ return (<ScrollView contentContainerStyle={{padding:16}}>
  <Text style={{fontSize:22,fontWeight:'800',marginBottom:8}}>Privacy Policy</Text>
  <Text style={{marginBottom:8}}>We do not share your data with third parties. Data is processed locally and/or via our own backend under your consent (DPA). No analytics SDKs embedded. You can export and delete your data at any time.</Text>
  <Text style={{fontWeight:'700',marginTop:12}}>Data We Collect</Text>
  <Text>- Account (email)</Text><Text>- Therapy inputs (questionnaire/direct)</Text><Text>- Consent events (privacy timeline)</Text>
  <Text style={{fontWeight:'700',marginTop:12}}>Sharing</Text><Text>None. Outbound requests blocked by backend whitelist.</Text>
</ScrollView>); }
