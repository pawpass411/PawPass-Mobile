import { useEffect, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Button, Card, Input, PawText, StarRating } from "../ui";
import { api, ApiError, UserProfile } from "../../lib/api";
import { listReviewOutbox, queueReview, ReviewOutboxDraft } from "../../lib/review-outbox";
import { Colors, Radius, Spacing } from "../../lib/theme";
import { track } from "../../lib/analytics";
import { uploadReviewImages } from "../../lib/review-uploads";

export type SelectedImage = { uri: string; name: string; mimeType: string };
type ReviewTarget =
  | { kind: "business"; businessLocationId: string; placeName: string }
  | { kind: "park"; parkId: string; placeName: string };

export const HANDLER_TAGS = [
  ["staff_professional", "Staff was professional and respectful"],
  ["clear_entry_space", "Clear entry and path of travel"],
  ["service_dog_ready", "Staff handled service-dog access well"],
  ["professional_access", "Respectful service-dog access experience"],
  ["two_questions_correct", "Staff used the two permitted questions appropriately"],
  ["no_documents_requested", "No paperwork or ID was requested"],
  ["documents_requested", "Paperwork, ID, or certification was requested"],
  ["entry_denied", "Entry or service was denied"],
  ["extra_fee", "An extra fee or deposit was requested"],
  ["staff_uncertain", "Staff seemed unsure how to handle access"],
  ["access_path_blocked", "The access route or seating area was difficult to navigate"],
  ["other_dog_conflict", "Another dog created an access or safety concern"],
  ["service_dog_space", "The team had enough space to navigate"],
  ["manager_helpful", "A manager helped resolve the situation"],
] as const;

export const DOG_OWNER_TAGS = [
  ["dog_water_available", "Water bowl or water station available"],
  ["dog_patio_available", "Outdoor seating or patio available"],
  ["dog_shade_available", "Shade or a cool waiting area available"],
  ["dog_treats_available", "Treats, dog menu, or welcome extras available"],
  ["dog_easy_entry", "Easy entry and room to move with a dog"],
  ["dog_staff_friendly", "Staff was friendly toward pet dogs"],
  ["dog_calm_environment", "Calm environment for dogs"],
  ["dog_limited_space", "Limited room for dogs"],
  ["dog_loud_or_busy", "Loud, crowded, or overstimulating"],
  ["dog_rules_unclear", "Pet-dog rules were unclear"],
] as const;

export const PARK_TAGS = [
  ["accessible_paths", "Accessible paths"],
  ["restrooms_available", "Restrooms available"],
  ["water_available", "Water available"],
  ["shade_available", "Shade available"],
  ["parking_accessible", "Accessible parking"],
  ["waste_bags_trash", "Waste bags or trash available"],
  ["off_leash_area", "Off-leash area"],
  ["leash_rules_clear", "Leash rules were clear"],
  ["crowded_or_busy", "Crowded or busy"],
  ["uneven_terrain", "Uneven terrain"],
  ["wildlife_or_livestock", "Wildlife or livestock present"],
  ["other_dog_conflict", "Another dog created a concern"],
] as const;

export const ACCESS_ISSUES = [
  ["", "No category"],
  ["denied_entry", "Denied entry"],
  ["staff_education_issue", "Staff education issue"],
  ["accessibility_navigation_issue", "Accessibility or navigation issue"],
  ["positive_accommodation", "Positive accommodation"],
  ["staff_professionalism", "Staff professionalism"],
  ["service_dog_conflict", "Service-dog conflict"],
  ["general_public_space_experience", "General public-space experience"],
] as const;

export async function chooseImages(max: number): Promise<SelectedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Photo-library permission is needed to add pictures.");
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: max,
    quality: 0.82,
  });
  if (result.canceled) return [];
  return Promise.all(result.assets.slice(0, max).map(async (asset, index) => {
    const resize = Math.max(asset.width ?? 0, asset.height ?? 0) > 1800
      ? [{ resize: (asset.width ?? 0) >= (asset.height ?? 0) ? { width: 1800 } : { height: 1800 } }]
      : [];
    const prepared = await ImageManipulator.manipulateAsync(asset.uri, resize, {
      compress: 0.76,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return {
      uri: prepared.uri,
      name: `${(asset.fileName || `pawpass-${Date.now()}-${index}`).replace(/\.[^.]+$/, "")}.jpg`,
      mimeType: "image/jpeg",
    };
  }));
}

export function appendImages(form: FormData, field: string, images: SelectedImage[]) {
  images.forEach(image => {
    form.append(field, {
      uri: image.uri,
      name: image.name,
      type: image.mimeType,
    } as any);
  });
}

function PhotoGroup({
  label,
  help,
  images,
  onChange,
}: {
  label: string;
  help: string;
  images: SelectedImage[];
  onChange: (images: SelectedImage[]) => void;
}) {
  const add = async () => {
    try {
      onChange(await chooseImages(4));
    } catch {
      // Permission errors are explained by the system prompt.
    }
  };
  return (
    <View style={{ gap: Spacing[2] }}>
      <PawText variant="body" weight="bold">{label}</PawText>
      <PawText variant="caption" color={Colors.muted} style={{ lineHeight: 19 }}>{help}</PawText>
      <Button onPress={add} variant="outline" size="sm">
        {images.length ? "Change pictures" : "Add pictures"}
      </Button>
      {images.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing[2] }}>
          {images.map(image => (
            <Image key={image.uri} source={image.uri} style={{ width: 66, height: 66, borderRadius: Radius.sm }} contentFit="cover" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ReviewForm({ target, onSubmitted }: { target: ReviewTarget; onSubmitted?: () => void }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [dogFriendly, setDogFriendly] = useState<boolean | null>(null);
  const [accessRating, setAccessRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [accessIssue, setAccessIssue] = useState("");
  const [body, setBody] = useState("");
  const [publicPhotos, setPublicPhotos] = useState<SelectedImage[]>([]);
  const [verificationPhotos, setVerificationPhotos] = useState<SelectedImage[]>([]);
  const [receiptPhotos, setReceiptPhotos] = useState<SelectedImage[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsMessage, setGpsMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState("");
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const targetId = target.kind === "business" ? target.businessLocationId : target.parkId;
  const reviewStarted = useRef(false);
  const reviewFinished = useRef(false);

  useEffect(() => {
    if (!profileReady || !isSignedIn || !profile?.onboardingCompletedAt || existingReviewId || checkingExisting || reviewStarted.current) return;
    reviewStarted.current = true;
    void track({ eventName:"review_started", path:`/${target.kind}/${targetId}`, targetType:target.kind, targetId });
    return () => {
      if (!reviewFinished.current) void track({ eventName:"review_abandoned", path:`/${target.kind}/${targetId}`, targetType:target.kind, targetId });
    };
  }, [checkingExisting, existingReviewId, isSignedIn, profile?.onboardingCompletedAt, profileReady, target.kind, targetId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    setProfileReady(false);
    const cacheKey = `pawpass:review-profile:${userId}`;
    AsyncStorage.getItem(cacheKey)
      .then(value => { if (value) setProfile(JSON.parse(value) as UserProfile); })
      .catch(() => {});
    api.users.me().then(data => {
      setProfile(data.user);
      AsyncStorage.setItem(cacheKey, JSON.stringify(data.user)).catch(() => {});
    }).catch(() => {}).finally(() => setProfileReady(true));
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    setCheckingExisting(true);
    Promise.all([
      api.reviews.list(target.kind === "business"
        ? { mine:true, locationId:targetId }
        : { mine:true, parkId:targetId }).catch(() => ({ reviews: [] })),
      listReviewOutbox(),
    ])
      .then(([data, pending]) => {
        const queued = pending.find(item => item.ownerUserId === userId && item.target.kind === target.kind && (
          item.target.kind === "business"
            ? item.target.businessLocationId === targetId
            : item.target.parkId === targetId
        ));
        setExistingReviewId(data.reviews[0]?.id ?? (queued ? `outbox:${queued.id}` : null));
      })
      .catch(() => setExistingReviewId(null))
      .finally(() => setCheckingExisting(false));
  }, [isLoaded, isSignedIn, target.kind, targetId, userId]);

  const isHandlerReview = profile?.role === "HANDLER" || profile?.role === "TRAINER" || profile?.isHandler;
  const isBusinessAccount = profile?.role === "BUSINESS";
  const tagOptions = target.kind === "park" ? PARK_TAGS : isHandlerReview ? HANDLER_TAGS : DOG_OWNER_TAGS;

  const toggleTag = (tag: string) => {
    setTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]);
  };

  const addGps = async () => {
    setGpsMessage("");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setGpsMessage("Location permission was not granted. You can still submit without GPS.");
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGps({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy ?? 0,
      });
      setGpsMessage("Private GPS visit log added for PawPass moderation.");
    } catch {
      setGpsMessage("GPS could not be recorded. You can still submit the review.");
    }
  };

  const submit = async () => {
    setError("");
    if (!profile?.onboardingCompletedAt) {
      setError("Please finish choosing your PawPass account type before reviewing.");
      return;
    }
    if (isBusinessAccount) {
      setError("Business accounts cannot write public reviews. Use a handler, trainer, or dog-owner account.");
      return;
    }
    if (target.kind === "business" && isHandlerReview && accessRating < 1) {
      setError("Please choose a service-animal access rating.");
      return;
    }
    if ((!isHandlerReview || target.kind === "park") && dogFriendly === null) {
      setError("Please answer whether pet dogs are welcome.");
      return;
    }
    if (body.trim().length < 20) {
      setError("Please write at least 20 characters about your experience.");
      return;
    }

    const overallRating = target.kind === "business" && isHandlerReview
      ? accessRating
      : dogFriendly ? 5 : 1;
    const petTag = dogFriendly === null ? [] : [dogFriendly ? "pet_dog_friendly" : "pet_dog_not_friendly"];
    const draft: ReviewOutboxDraft = {
      ownerUserId: userId!,
      target,
      overallRating,
      accessRating: accessRating || undefined,
      tags: [...petTag, ...tags],
      accessIssueType: target.kind === "business" && isHandlerReview && accessIssue ? accessIssue : undefined,
      body: body.trim(),
      gps: gps ?? undefined,
      publicPhotos,
      verificationPhotos,
      receiptPhotos,
    };
    setSubmitting(true);
    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected || network.isInternetReachable === false) {
        await queueReview(draft);
        reviewFinished.current = true;
        void track({ eventName:"review_queued_offline", targetType:target.kind, targetId, success:true, metadata:{ photos:publicPhotos.length + verificationPhotos.length + receiptPhotos.length, hasGps:Boolean(gps) } });
        setQueued(true);
        setSubmitted(true);
        onSubmitted?.();
        return;
      }
      const [imageUrls, verificationPhotoUrls, receiptProofUrls] = await Promise.all([
        uploadReviewImages(publicPhotos, "public"),
        uploadReviewImages(verificationPhotos, "verification"),
        uploadReviewImages(receiptPhotos, "receipt"),
      ]);
      await api.reviews.create({
        ...(target.kind === "business" ? { businessLocationId: target.businessLocationId } : { parkId: target.parkId }),
        overallRating, accessRating: accessRating || undefined, tags: [...petTag, ...tags],
        accessIssueType: target.kind === "business" && isHandlerReview && accessIssue ? accessIssue : undefined,
        body: body.trim(), imageUrls, verificationPhotoUrls, receiptProofUrls,
        proofTypes: [...(verificationPhotoUrls.length ? ["photo"] : []), ...(receiptProofUrls.length ? ["receipt"] : []), ...(gps ? ["gps"] : [])],
        gpsLat: gps?.lat, gpsLng: gps?.lng, gpsAccuracy: gps?.accuracy,
      });
      reviewFinished.current = true;
      void track({ eventName:"review_submitted", targetType:target.kind, targetId, success:true, metadata:{ photos:publicPhotos.length + verificationPhotos.length + receiptPhotos.length, hasGps:Boolean(gps) } });
      setSubmitted(true);
      onSubmitted?.();
    } catch (caught) {
      const connectionFailure = !(caught instanceof ApiError) || caught.status === 0;
      if (connectionFailure) {
        try {
          await queueReview(draft);
          reviewFinished.current = true;
          void track({ eventName:"review_queued_offline", targetType:target.kind, targetId, success:true, metadata:{ reason:"connection_failure", photos:publicPhotos.length + verificationPhotos.length + receiptPhotos.length, hasGps:Boolean(gps) } });
          setQueued(true);
          setSubmitted(true);
          onSubmitted?.();
        } catch {
          setError("The review could not be uploaded or safely saved. Please keep this screen open and try again.");
        }
      } else {
        setError(caught instanceof Error ? caught.message : "Review submission failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || (isSignedIn && !profileReady)) return <PawText variant="body" color={Colors.muted}>Loading your review profile...</PawText>;
  if (!isSignedIn) {
    return (
      <Card style={{ gap: Spacing[3] }}>
        <PawText variant="h3">Sign in to review</PawText>
        <PawText variant="body" color={Colors.muted}>Your PawPass role determines which existing review questions you receive.</PawText>
        <Button onPress={() => router.push("/(auth)/sign-in")} fullWidth>Sign In</Button>
      </Card>
    );
  }
  if (!profile?.onboardingCompletedAt) {
    return (
      <Card style={{ gap: Spacing[3] }}>
        <PawText variant="h3">Choose your PawPass account type</PawText>
        <PawText variant="body" color={Colors.muted}>
          Before reviewing, tell us whether you are a Dog Owner, Service Dog Handler, Service Dog Trainer, or both a Handler and Trainer. This determines the review questions you receive.
        </PawText>
        <Button onPress={() => router.push("/onboarding")} fullWidth>Choose my account type</Button>
      </Card>
    );
  }
  if (checkingExisting) return <PawText variant="body" color={Colors.muted}>Checking your PawPass reviews...</PawText>;
  if (existingReviewId) {
    return (
      <Card style={{ gap: Spacing[3] }}>
        <PawText variant="h3">You&apos;ve already reviewed {target.placeName}.</PawText>
        <PawText variant="body" color={Colors.muted}>PawPass allows one active review per person at each place so scores cannot be inflated. Update your existing review if your experience has changed.</PawText>
        <Button onPress={() => router.push("/reviews/mine")} fullWidth>Update my review</Button>
      </Card>
    );
  }
  if (submitted) {
    return (
      <Alert variant="success" title={queued ? "Review saved for upload" : "Review submitted for approval"}>
        {queued
          ? "Your review, pictures, and private GPS log are safely stored on this phone. PawPass will upload them when reception returns. Keep the app installed until it finishes."
          : "Your review is stored in PawPass and will appear publicly after moderation."}
      </Alert>
    );
  }

  return (
    <Card style={{ gap: Spacing[4] }}>
      <PawText variant="h3">Review {target.placeName}</PawText>
      <Alert variant="info">
        {target.kind === "park"
          ? "Park reviews use the same practical questions for dog owners, handlers, and trainers."
          : isHandlerReview
            ? `You are reviewing as a ${profile?.role === "TRAINER" && profile?.isHandler ? "service-dog handler and trainer" : profile?.role === "TRAINER" ? "service-dog trainer" : "service-dog handler"}.`
            : "You are reviewing from a dog-owner perspective."}
      </Alert>
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {(!isHandlerReview || target.kind === "park") ? (
        <View style={{ gap: Spacing[2] }}>
          <PawText variant="body" weight="bold">Are pet dogs welcome here? *</PawText>
          <View style={{ flexDirection: "row", gap: Spacing[2] }}>
            <Button style={{ flex: 1 }} variant={dogFriendly === true ? "primary" : "outline"} onPress={() => setDogFriendly(true)}>Yes</Button>
            <Button style={{ flex: 1 }} variant={dogFriendly === false ? "primary" : "outline"} onPress={() => setDogFriendly(false)}>No</Button>
          </View>
        </View>
      ) : null}

      {(isHandlerReview || target.kind === "park") ? (
        <View>
          <PawText variant="body" weight="bold" style={{ marginBottom: Spacing[2] }}>
            {target.kind === "park" ? "Park access and comfort rating" : "Service-animal access rating *"}
          </PawText>
          <StarRating value={accessRating} onChange={setAccessRating} color={Colors.info} />
        </View>
      ) : null}

      {target.kind === "business" && isHandlerReview ? (
        <View style={{ gap: Spacing[2] }}>
          <PawText variant="body" weight="bold">Experience category</PawText>
          {ACCESS_ISSUES.map(([value, label]) => (
            <TouchableOpacity
              key={value || "none"}
              onPress={() => setAccessIssue(value)}
              style={{
                padding: Spacing[3],
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: accessIssue === value ? Colors.infoBorder : Colors.border,
                backgroundColor: accessIssue === value ? Colors.infoDim : Colors.surface2,
              }}
            >
              <PawText variant="caption" color={accessIssue === value ? Colors.info : Colors.text}>{label}</PawText>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={{ gap: Spacing[2] }}>
        <PawText variant="body" weight="bold">What applies?</PawText>
        {tagOptions.map(([tag, label]) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            style={{
              padding: Spacing[3],
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: tags.includes(tag) ? Colors.infoBorder : Colors.border,
              backgroundColor: tags.includes(tag) ? Colors.infoDim : Colors.surface2,
            }}
          >
            <PawText variant="caption" color={tags.includes(tag) ? Colors.info : Colors.text}>
              {tags.includes(tag) ? "✓ " : ""}{label}
            </PawText>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Your experience *"
        value={body}
        onChangeText={setBody}
        placeholder={target.kind === "park"
          ? "Describe paths, restrooms, water, parking, crowds, leash rules, terrain, and dog interactions..."
          : "Describe what happened in your own words..."}
        multiline
        numberOfLines={6}
        hint={`${body.length}/1500 · minimum 20 characters`}
      />

      <PhotoGroup
        label="Public review pictures"
        help="Add up to four pictures that may appear with your review. Avoid medical information or unrelated people."
        images={publicPhotos}
        onChange={setPublicPhotos}
      />
      <PhotoGroup
        label="Private verification pictures"
        help="Optional evidence for PawPass moderation. These pictures are not displayed publicly by default."
        images={verificationPhotos}
        onChange={setVerificationPhotos}
      />
      <PhotoGroup
        label="Private receipt or visit proof"
        help="Optional receipt or visit pictures used for moderation and trust scoring."
        images={receiptPhotos}
        onChange={setReceiptPhotos}
      />

      <View style={{ gap: Spacing[2] }}>
        <PawText variant="body" weight="bold">Private GPS visit log</PawText>
        <PawText variant="caption" color={Colors.muted} style={{ lineHeight: 19 }}>
          Records your current coordinates for PawPass moderation. Coordinates are not shown publicly.
        </PawText>
        <Button onPress={addGps} variant="outline" size="sm">{gps ? "Update GPS log" : "Add GPS log"}</Button>
        {gpsMessage ? <PawText variant="caption" color={gps ? Colors.accent : Colors.muted}>{gpsMessage}</PawText> : null}
      </View>

      <Alert variant="info" title="Community guidelines">
        Describe your own experience. Avoid legal conclusions, medical information, or personal details about staff.
      </Alert>
      <Button onPress={submit} loading={submitting} fullWidth>Submit Review</Button>
    </Card>
  );
}
