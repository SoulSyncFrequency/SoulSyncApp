
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { getPrivacyTimeline } from '../api';
export default function PrivacyTimeline(){
  const [events,setEvents]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{ try{ setEvents(await getPrivacyTimeline()); } finally{ setLoading(false); }})();},[]);
  if (loading) return <ActivityIndicator />;
  return (<View style={{padding:16}}>
    <Text style={{fontSize:22,fontWeight:'700',marginBottom:12}}>Privacy Timeline</Text>
    <FlatList data={events} keyExtractor={(_,i)=>String(i)}
      renderItem={({item})=>(<View style={{paddingVertical:8,borderBottomWidth:1,borderColor:'#eee'}}>
        <Text style={{fontWeight:'600'}}>{item.type}</Text>
        <Text>User: {item.userId}</Text>
        <Text>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>)}
      ListEmptyComponent={<Text>No privacy events yet.</Text>} />
  </View>);
}
