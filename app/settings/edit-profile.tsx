import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Alert, Button, Card, Input, PawText } from "../../src/components/ui";
import { chooseImages, SelectedImage } from "../../src/components/reviews/review-form";
import { api, UserProfile } from "../../src/lib/api";
import { Colors, Radius, Spacing } from "../../src/lib/theme";

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<UserProfile|null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<SelectedImage|null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.users.me().then(({user}) => { setProfile(user); setName(user.name ?? ""); setBio(user.bio ?? ""); setPhone(user.phone ?? ""); }).catch(() => setError("Could not load your profile.")); }, []);

  const chooseAvatar = async () => {
    try {
      const [image] = await chooseImages(1);
      if (image) setAvatar(image);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not select a profile picture.");
    }
  };

  const save = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    setSaving(true); setError("");
    try {
      let avatarUrl = profile?.avatarUrl ?? null;
      if (avatar) {
        const form = new FormData();
        form.append("kind", "user");
        form.append("image", { uri:avatar.uri, name:avatar.name, type:avatar.mimeType } as any);
        avatarUrl = (await api.users.uploadAvatar(form)).imageUrl;
      }
      await api.users.update({ name:name.trim(), bio:bio.trim(), phone:phone.trim(), avatarUrl });
      router.back();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save your profile."); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView style={{flex:1,backgroundColor:Colors.bg}} contentContainerStyle={{padding:Spacing[4],gap:Spacing[3]}} keyboardShouldPersistTaps="handled">
      <Card style={{gap:Spacing[3]}}>
        <PawText variant="h2">Edit profile</PawText>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <View style={{alignItems:"center",gap:Spacing[2]}}>
          {(avatar?.uri || profile?.avatarUrl) ? <Image source={{uri:avatar?.uri || profile?.avatarUrl || ""}} style={{width:92,height:92,borderRadius:Radius.full,borderWidth:2,borderColor:Colors.info}}/> : null}
          <Button variant="outline" size="sm" onPress={chooseAvatar}>Change profile picture</Button>
        </View>
        <Input label="Name" value={name} onChangeText={setName}/>
        <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} hint={`${bio.length}/500`}/>
        <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
        <Alert variant="info">Your account type is managed separately under Handler Status.</Alert>
        <Button onPress={save} loading={saving} fullWidth>Save profile</Button>
      </Card>
    </ScrollView>
  );
}
